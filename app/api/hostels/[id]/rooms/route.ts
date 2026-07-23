import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createRoomSchema } from "@/lib/validation_schema";
import { requireFullAccess } from "@/lib/subscription";
import { authzErrorResponse } from "@/lib/authz";

// GET all rooms for a hostel
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const roomType = searchParams.get("roomType");
    const available = searchParams.get("available") === "true";

    const where = {
      hostelId: params.id,
      ...(roomType ? { roomType: roomType as any } : {}),
      ...(searchParams.has("available") ? { isAvailable: available } : {}),
    };

    const rooms = await prisma.room.findMany({
      where,
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
          },
        },
      },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

// POST create a new room
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    if (user.role !== "SUPER_ADMIN") {
      await requireFullAccess(params.id);
    }

    const body = await req.json();
    const validatedData = createRoomSchema.parse(body);

    // Check if room number already exists in this hostel
    const existingRoom = await prisma.room.findFirst({
      where: {
        hostelId: params.id,
        roomNumber: validatedData.roomNumber,
      },
    });

    if (existingRoom) {
      return NextResponse.json(
        { error: "Room number already exists in this hostel" },
        { status: 400 }
      );
    }

    const room = await prisma.room.create({
      data: {
        ...validatedData,
        hostelId: params.id,
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
