import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, Status } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireUser, requireHostelAccess, authzErrorResponse } from "@/lib/authz";
import { createBookingSchema } from "@/lib/validation_schema";
import { calculateBookingPrice } from "@/lib/pricing";
import { requireFullAccess } from "@/lib/subscription";

// GET all bookings for the current user
export async function GET(req: Request) {
  try {
    const user = await requireUser();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const hostelId = searchParams.get("hostelId");
    const limit = searchParams.get("limit")
      ? Number.parseInt(searchParams.get("limit") as string)
      : 10;
    const page = searchParams.get("page")
      ? Number.parseInt(searchParams.get("page") as string)
      : 1;
    const skip = (page - 1) * limit;

    // Build the where clause based on user role and query params
    const where: any = {};

    if (user.role === "STUDENT") {
      // Students can only see their own bookings
      where.userId = user.id;
    } else if (user.role === "HOSTEL_ADMIN") {
      if (hostelId) {
        // Scope to a single hostel — the admin picked one from the selector.
        await requireHostelAccess(user.id, user.role, hostelId);
        where.room = { hostelId };
      } else {
        // No hostel selected yet — fall back to every hostel this admin manages.
        where.room = {
          hostel: {
            admins: {
              some: {
                id: user.id,
              },
            },
          },
        };
      }
    } else if (user.role === "SUPER_ADMIN" && hostelId) {
      where.room = { hostelId };
    }
    // Super admins with no hostelId can see all bookings

    // Add status filter if provided
    if (status) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
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
                city: true,
                state: true,
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
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const total = await prisma.booking.count({ where });

    return NextResponse.json({
      bookings,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
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

// POST create a new booking
export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const body = await req.json();
    // totalPrice is never accepted from the client — it's always recomputed
    // server-side from the room's price so a request can't set its own price.
    const validatedData = createBookingSchema.parse(body);
    const { roomId, checkIn, checkOut } = validatedData;

    if (checkIn >= checkOut) {
      return NextResponse.json(
        { error: "Check-out date must be after check-in date" },
        { status: 400 }
      );
    }

    if (checkIn < new Date()) {
      return NextResponse.json(
        { error: "Check-in date cannot be in the past" },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (!room.isAvailable) {
      return NextResponse.json(
        { error: "Room is not available" },
        { status: 400 }
      );
    }

    await requireFullAccess(room.hostelId);

    const totalPrice = calculateBookingPrice(room.price, checkIn, checkOut);

    // Overlap check + insert happen inside one serializable transaction so two
    // concurrent requests for the same dates can't both pass the check and
    // double-book the room (the previous check-then-act was a real race).
    const booking = await prisma.$transaction(
      async (tx) => {
        const overlapping = await tx.booking.findFirst({
          where: { roomId, ...overlapClause(checkIn, checkOut) },
        });

        if (overlapping) {
          throw new RoomUnavailableError();
        }

        return tx.booking.create({
          data: {
            checkIn,
            checkOut,
            totalPrice,
            status: "PENDING",
            userId: user.id,
            roomId,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return NextResponse.json(booking, { status: 201 });
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

    // Serializable transaction conflict — another request won the race.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "This room was just booked by someone else. Please try different dates." },
        { status: 409 }
      );
    }

    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

class RoomUnavailableError extends Error {}
