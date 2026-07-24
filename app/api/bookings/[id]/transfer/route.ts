import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, Status } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireRole, requireHostelAccess, authzErrorResponse } from "@/lib/authz";
import { roomTransferSchema } from "@/lib/validation_schema";
import { calculateBookingPrice } from "@/lib/pricing";

// POST move a student from their current room to another room in the same
// hostel: closes the old booking and opens a new one for the same dates,
// inside one transaction so the room can't be double-booked in the process.
export async function POST(req: Request, { params: __params }: { params: Promise<{ id: string }> }) {
  const params = await __params;
  try {
    const user = await requireRole("HOSTEL_ADMIN", "SUPER_ADMIN");

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { room: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    await requireHostelAccess(user.id, user.role, booking.room.hostelId);

    if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Only an active booking can be transferred" },
        { status: 400 }
      );
    }

    const { newRoomId } = roomTransferSchema.parse(await req.json());

    const newRoom = await prisma.room.findUnique({ where: { id: newRoomId } });
    if (!newRoom || newRoom.hostelId !== booking.room.hostelId) {
      return NextResponse.json(
        { error: "The new room must be in the same hostel" },
        { status: 400 }
      );
    }
    if (!newRoom.isAvailable) {
      return NextResponse.json({ error: "The new room is not available" }, { status: 400 });
    }

    const newTotalPrice = calculateBookingPrice(newRoom.price, booking.checkIn, booking.checkOut);

    const newBooking = await prisma.$transaction(
      async (tx) => {
        const overlapping = await tx.booking.findFirst({
          where: {
            roomId: newRoomId,
            status: { in: [Status.PENDING, Status.CONFIRMED] },
            OR: [
              { AND: [{ checkIn: { lte: booking.checkIn } }, { checkOut: { gt: booking.checkIn } }] },
              { AND: [{ checkIn: { lt: booking.checkOut } }, { checkOut: { gte: booking.checkOut } }] },
              { AND: [{ checkIn: { gte: booking.checkIn } }, { checkOut: { lte: booking.checkOut } }] },
            ],
          },
        });
        if (overlapping) throw new RoomUnavailableError();

        await tx.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });

        return tx.booking.create({
          data: {
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            totalPrice: newTotalPrice,
            status: booking.status,
            userId: booking.userId,
            roomId: newRoomId,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    await prisma.notification.create({
      data: {
        title: "Room transfer complete",
        message: `You've been moved to room ${newRoom.roomNumber}.`,
        type: "BOOKING",
        userId: booking.userId,
      },
    });

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }

    if (error instanceof RoomUnavailableError) {
      return NextResponse.json(
        { error: "The new room was just booked for these dates" },
        { status: 409 }
      );
    }

    console.error("Error transferring booking:", error);
    return NextResponse.json({ error: "Failed to transfer booking" }, { status: 500 });
  }
}

class RoomUnavailableError extends Error {}
