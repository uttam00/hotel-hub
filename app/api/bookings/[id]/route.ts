import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, Status } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireUser, authzErrorResponse } from "@/lib/authz";
import { bookingUpdateSchema } from "@/lib/validation_schema";
import { calculateBookingPrice } from "@/lib/pricing";
import { notifyNextWaiting } from "@/lib/waitlist";

// GET a specific booking
export async function GET(
  req: Request,
  { params: __params }: { params: Promise<{ id: string }> }) {
  const params = await __params;
  try {
    const user = await requireUser();

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            roomType: true,
            price: true,
            hostel: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                state: true,
                zipCode: true,
                country: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
            createdAt: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (
      (user.role === "STUDENT" && booking.userId !== user.id) ||
      (user.role === "HOSTEL_ADMIN" &&
        !(await isHostelAdmin(user.id, booking.room.hostel.id)))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

function overlapClause(checkIn: Date, checkOut: Date): Prisma.BookingWhereInput {
  return {
    status: { in: [Status.PENDING, Status.CONFIRMED] },
    OR: [
      { AND: [{ checkIn: { lte: checkIn } }, { checkOut: { gt: checkIn } }] },
      { AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gte: checkOut } }] },
      { AND: [{ checkIn: { gte: checkIn } }, { checkOut: { lte: checkOut } }] },
    ],
  };
}

// PUT update a booking
export async function PUT(
  req: Request,
  { params: __params }: { params: Promise<{ id: string }> }) {
  const params = await __params;
  try {
    const user = await requireUser();

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        room: {
          select: { id: true, hostelId: true, price: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (
      (user.role === "STUDENT" && booking.userId !== user.id) ||
      (user.role === "HOSTEL_ADMIN" &&
        !(await isHostelAdmin(user.id, booking.room.hostelId)))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = bookingUpdateSchema.parse(body);

    const checkIn = validatedData.checkIn ?? booking.checkIn;
    const checkOut = validatedData.checkOut ?? booking.checkOut;
    const datesChanged = !!(validatedData.checkIn || validatedData.checkOut);

    if (datesChanged && checkIn >= checkOut) {
      return NextResponse.json(
        { error: "Check-out date must be after check-in date" },
        { status: 400 }
      );
    }

    // totalPrice is recomputed server-side, never accepted from the client.
    const updateData: Prisma.BookingUpdateInput = {
      ...validatedData,
      ...(datesChanged
        ? { totalPrice: calculateBookingPrice(booking.room.price, checkIn, checkOut) }
        : {}),
    };

    const updatedBooking = await prisma.$transaction(
      async (tx) => {
        if (datesChanged) {
          const overlapping = await tx.booking.findFirst({
            where: {
              roomId: booking.roomId,
              id: { not: booking.id },
              ...overlapClause(checkIn, checkOut),
            },
          });
          if (overlapping) throw new RoomUnavailableError();
        }

        return tx.booking.update({
          where: { id: params.id },
          data: updateData,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return NextResponse.json(updatedBooking);
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.flatten() },
        { status: 400 }
      );
    }

    if (error instanceof RoomUnavailableError) {
      return NextResponse.json(
        { error: "Room is already booked for the selected dates" },
        { status: 409 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "This room was just booked by someone else. Please try different dates." },
        { status: 409 }
      );
    }

    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

// DELETE a booking (cancel)
export async function DELETE(
  req: Request,
  { params: __params }: { params: Promise<{ id: string }> }) {
  const params = await __params;
  try {
    const user = await requireUser();

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        room: {
          select: {
            id: true,
            hostelId: true,
            roomType: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (
      (user.role === "STUDENT" && booking.userId !== user.id) ||
      (user.role === "HOSTEL_ADMIN" &&
        !(await isHostelAdmin(user.id, booking.room.hostelId)))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Cannot cancel a booking that is not pending or confirmed" },
        { status: 400 }
      );
    }

    await prisma.booking.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    });

    await notifyNextWaiting(booking.room.hostelId, booking.room.roomType);

    return NextResponse.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}

class RoomUnavailableError extends Error {}

async function isHostelAdmin(userId: string, hostelId: string): Promise<boolean> {
  const hostel = await prisma.hostel.findUnique({
    where: { id: hostelId },
    include: {
      admins: { where: { id: userId } },
    },
  });

  return hostel?.admins.length ? hostel.admins.length > 0 : false;
}
