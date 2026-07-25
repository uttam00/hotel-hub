import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { roomUpdateSchema } from "@/lib/validation_schema";


// GET a specific room
export async function GET(
  req: Request,
  { params: __params }: { params: Promise<{ id: string; roomId: string }> }) {
  const params = await __params;
  try {
    const room = await prisma.room.findUnique({
      where: {
        id: params.roomId,
        hostelId: params.id,
      },
      include: {
        bookings: {
          where: {
            status: {
              in: ["PENDING", "CONFIRMED"],
            },
          },
          select: {
            id: true,
            checkIn: true,
            checkOut: true,
            status: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    );
  }
}

// PUT update a room
export async function PUT(
  req: Request,
  { params: __params }: { params: Promise<{ id: string; roomId: string }> }) {
  const params = await __params;
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an admin of this hostel or a super admin
    const hostel = await prisma.hostel.findUnique({
      where: { id: params.id },
      include: {
        admins: {
          where: { id: user.id },
        },
      },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found" }, { status: 404 });
    }

    if (hostel.admins.length === 0 && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const room = await prisma.room.findUnique({
      where: {
        id: params.roomId,
        hostelId: params.id,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = roomUpdateSchema.parse(body);

    // If room number is being updated, check if it already exists
    if (
      validatedData.roomNumber &&
      validatedData.roomNumber !== room.roomNumber
    ) {
      const existingRoom = await prisma.room.findFirst({
        where: {
          hostelId: params.id,
          roomNumber: validatedData.roomNumber,
          id: { not: params.roomId },
        },
      });

      if (existingRoom) {
        return NextResponse.json(
          { error: "Room number already exists in this hostel" },
          { status: 400 }
        );
      }
    }

    const updatedRoom = await prisma.room.update({
      where: {
        id: params.roomId,
      },
      data: validatedData,
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Error updating room:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

// DELETE a room
export async function DELETE(
  req: Request,
  { params: __params }: { params: Promise<{ id: string; roomId: string }> }) {
  const params = await __params;
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an admin of this hostel or a super admin
    const hostel = await prisma.hostel.findUnique({
      where: { id: params.id },
      include: {
        admins: {
          where: { id: user.id },
        },
      },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found" }, { status: 404 });
    }

    if (hostel.admins.length === 0 && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: {
        id: params.roomId,
        hostelId: params.id,
      },
      include: {
        bookings: {
          where: {
            status: {
              in: ["PENDING", "CONFIRMED"],
            },
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if room has active bookings
    if (room.bookings.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete room with active bookings" },
        { status: 400 }
      );
    }

    await prisma.room.delete({
      where: {
        id: params.roomId,
      },
    });

    return NextResponse.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
