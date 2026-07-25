import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hostelUpdateSchema } from "@/lib/validation_schema";
import { NextResponse } from "next/server";
import { z } from "zod";

// GET all hostels for super admin or own hostel for hostel admin
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();

    if (
      !user ||
      (user.role !== "SUPER_ADMIN" && user.role !== "HOSTEL_ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    if (status) whereClause.status = status;

    if (user.role === "HOSTEL_ADMIN") {
      const adminHostels = await prisma.hostel.findMany({
        where: {
          admins: {
            some: {
              id: user.id,
            },
          },
        },
        select: { id: true },
      });

      const adminHostelIds = adminHostels.map((h) => h.id);
      whereClause.id = { in: adminHostelIds };
    }

    const hostels = await prisma.hostel.findMany({
      where: whereClause,
      include: {
        rooms: {
          select: {
            id: true,
            roomNumber: true,
            roomType: true,
            price: true,
            status: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.hostel.count({ where: whereClause });

    const hostelsWithMetrics = hostels.map((hostel) => {
      const totalRatings = hostel.reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating =
        hostel.reviews.length > 0 ? totalRatings / hostel.reviews.length : 0;
      const availableRooms = hostel.rooms.filter(
        (room) => room.status === "AVAILABLE"
      ).length;

      return {
        ...hostel,
        averageRating,
        reviewCount: hostel.reviews.length,
        availableRooms,
        totalRooms: hostel.rooms.length,
      };
    });

    return NextResponse.json({
      hostels: hostelsWithMetrics,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching hostels:", error);
    return NextResponse.json(
      { error: "Failed to fetch hostels" },
      { status: 500 }
    );
  }
}

// PUT update hostel (super admin or owning hostel admin)
export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();

    if (
      !user ||
      (user.role !== "SUPER_ADMIN" && user.role !== "HOSTEL_ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { hostelId, ...updateData } = body;

    if (!hostelId) {
      return NextResponse.json(
        { error: "Hostel ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership if hostel admin
    if (user.role === "HOSTEL_ADMIN") {
      const ownsHostel = await prisma.hostel.findFirst({
        where: {
          id: hostelId,
          admins: {
            some: {
              id: user.id,
            },
          },
        },
      });

      if (!ownsHostel) {
        return NextResponse.json(
          { error: "Forbidden: Not your hostel" },
          { status: 403 }
        );
      }
    }

    const validatedData = hostelUpdateSchema.parse(updateData);

    const hostel = await prisma.hostel.update({
      where: { id: hostelId },
      data: validatedData,
    });

    return NextResponse.json(hostel);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Error updating hostel:", error);
    return NextResponse.json(
      { error: "Failed to update hostel" },
      { status: 500 }
    );
  }
}
