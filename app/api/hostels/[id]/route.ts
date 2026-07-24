import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hostelUpdateSchema } from "@/lib/validation_schema";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, authzErrorResponse } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

// GET a specific hostel
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const hostel = await prisma.hostel.findUnique({
      where: { id: params.id },
      include: {
        rooms: {
          select: {
            id: true,
            roomNumber: true,
            roomType: true,
            description: true,
            price: true,
            capacity: true,
            isAvailable: true,
            amenities: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found" }, { status: 404 });
    }

    // Calculate average rating
    const totalRatings = hostel.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const averageRating =
      hostel.reviews.length > 0 ? totalRatings / hostel.reviews.length : 0;

    return NextResponse.json({
      ...hostel,
      averageRating,
      reviewCount: hostel.reviews.length,
    });
  } catch (error) {
    console.error("Error fetching hostel:", error);
    return NextResponse.json(
      { error: "Failed to fetch hostel" },
      { status: 500 }
    );
  }
}

// PUT update a hostel
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
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

    const body = await req.json();
    const validatedData = hostelUpdateSchema.parse(body);

    const updatedHostel = await prisma.hostel.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(updatedHostel);
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

// DELETE a hostel — blocked while it still has rooms, since Room (and
// everything under it: bookings, payments) cascades on delete. Deleting a
// hostel with active rooms would otherwise silently wipe booking/payment
// history. The many-to-many admin link is cleared automatically by Prisma
// when the hostel row is deleted, so no manual disconnect step is needed.
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("SUPER_ADMIN");

    const params = await context.params;

    const hostel = await prisma.hostel.findUnique({
      where: { id: params.id },
      include: { _count: { select: { rooms: true } } },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found" }, { status: 404 });
    }

    if (hostel._count.rooms > 0) {
      return NextResponse.json(
        {
          error: "HOSTEL_HAS_ROOMS",
          message: "Cannot delete a hostel that still has rooms. Remove its rooms first.",
        },
        { status: 400 }
      );
    }

    await prisma.hostel.delete({
      where: { id: params.id },
    });

    await logAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "HOSTEL_DELETED",
      entityType: "Hostel",
      entityId: params.id,
      metadata: { name: hostel.name },
    });

    return NextResponse.json({ message: "Hostel deleted successfully" });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error deleting hostel:", error);
    return NextResponse.json(
      { error: "Failed to delete hostel" },
      { status: 500 }
    );
  }
}
