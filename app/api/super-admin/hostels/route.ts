import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { createHostelSchema, hostelUpdateSchema } from "@/lib/validation_schema";

// Define types for the hostel with included relations
type HostelWithRelations = {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  image: string | null;
  amenities: string[];
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
  admins: Array<{
    id: string;
    name: string | null;
    email: string | null;
  }>;
  rooms: Array<{
    id: string;
    roomNumber: string;
    roomType: string;
    price: number;
    status: string;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
  }>;
};

// GET all hostels (super admin only)
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = searchParams.get("limit")
      ? Number.parseInt(searchParams.get("limit") as string)
      : 10;
    const page = searchParams.get("page")
      ? Number.parseInt(searchParams.get("page") as string)
      : 1;
    const skip = (page - 1) * limit;

    // Use type assertion for the where clause
    const where = status ? { status: status as any } : {};

    const hostels = (await prisma.hostel.findMany({
      where: where as any,
      include: {
        admins: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
    })) as unknown as HostelWithRelations[];

    const total = await prisma.hostel.count({ where: where as any });

    // Calculate additional metrics for each hostel
    const hostelsWithMetrics = hostels.map((hostel) => {
      const totalRatings = hostel.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { adminId, ...hostelBody } = body;
    const hostelData = createHostelSchema.parse(hostelBody);

    // If adminId is provided, check if admin exists and has no hostels
    if (adminId) {
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
        include: {
          hostels: true,
        },
      });

      if (!admin) {
        return new NextResponse("Admin not found", { status: 404 });
      }

      if (admin.hostels.length > 0) {
        return new NextResponse(
          JSON.stringify({
            error: "ADMIN_HAS_HOSTEL",
            message: "This admin already manages a hostel",
          }),
          { status: 400 }
        );
      }
    }

    // Rooms are no longer auto-generated here — the super-admin adds them
    // explicitly through the hostel form's room management UI after the
    // hostel is created.
    const hostel = await prisma.hostel.create({
      data: {
        ...hostelData,
        admins: adminId
          ? {
              connect: { id: adminId },
            }
          : undefined,
      },
      include: {
        admins: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(hostel);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }

    console.error("[HOSTELS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PUT update hostel (super admin only)
export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
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
