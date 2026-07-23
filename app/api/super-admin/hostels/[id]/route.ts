import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const hostel = await prisma.hostel.findUnique({
      where: { id: params.id },
      include: {
        admins: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            rooms: true,
            reviews: true,
          },
        },
      },
    });

    if (!hostel) {
      return new NextResponse("Hostel not found", { status: 404 });
    }

    return NextResponse.json(hostel);
  } catch (error) {
    console.error("[HOSTEL_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      address,
      description,
      city,
      state,
      zipCode,
      country,
      amenities,
      adminId,
    } = body;

    // Validate required fields
    if (
      !name ||
      !address ||
      !description ||
      !city ||
      !state ||
      !zipCode ||
      !country
    ) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if hostel exists
    const existingHostel = await prisma.hostel.findUnique({
      where: { id: params.id },
      include: {
        rooms: true,
      },
    });

    if (!existingHostel) {
      return new NextResponse("Hostel not found", { status: 404 });
    }

    // If hostel has rooms, prevent changing admin
    if (existingHostel.rooms.length > 0 && adminId) {
      return new NextResponse(
        JSON.stringify({
          error: "HOSTEL_HAS_ROOMS",
          message: "Cannot change admin while hostel has rooms",
        }),
        { status: 400 }
      );
    }

    // If adminId is provided, check if the admin exists
    if (adminId) {
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
      });

      if (!admin) {
        return new NextResponse("Admin not found", { status: 404 });
      }

      if (admin.role !== "HOSTEL_ADMIN") {
        return new NextResponse(
          JSON.stringify({
            error: "INVALID_ADMIN_ROLE",
            message: "User must be a hostel admin",
          }),
          { status: 400 }
        );
      }
    }

    const hostel = await prisma.hostel.update({
      where: { id: params.id },
      data: {
        name,
        address,
        description,
        city,
        state,
        zipCode,
        country,
        amenities: amenities || [],
        admins: adminId
          ? {
              set: [{ id: adminId }],
            }
          : {
              set: [],
            },
      },
    });

    return NextResponse.json(hostel);
  } catch (error) {
    console.error("[HOSTEL_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if hostel exists and has rooms
    const hostel = await prisma.hostel.findUnique({
      where: { id: params.id },
      include: {
        rooms: true,
      },
    });

    if (!hostel) {
      return new NextResponse("Hostel not found", { status: 404 });
    }

    if (hostel.rooms.length > 0) {
      return new NextResponse(
        JSON.stringify({
          error: "HOSTEL_HAS_ROOMS",
          message: "Cannot delete hostel with existing rooms",
        }),
        { status: 400 }
      );
    }

    await prisma.hostel.delete({
      where: { id: params.id },
    });

    await logAudit({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: "HOSTEL_DELETED",
      entityType: "Hostel",
      entityId: params.id,
      metadata: { name: hostel.name },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[HOSTEL_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH - Verify/approve/reject hostel (Super Admin only)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !["ACTIVE", "INACTIVE", "PENDING_VERIFICATION"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be ACTIVE, INACTIVE, or PENDING_VERIFICATION" },
        { status: 400 }
      );
    }

    const hostel = await prisma.hostel.findUnique({
      where: { id: params.id },
      include: { admins: { select: { id: true, name: true, email: true } } },
    });

    if (!hostel) {
      return new NextResponse("Hostel not found", { status: 404 });
    }

    const updated = await prisma.hostel.update({
      where: { id: params.id },
      data: { status },
      include: {
        admins: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify hostel admins about the status change
    const statusText = status === "ACTIVE" ? "approved" : status === "INACTIVE" ? "rejected" : "pending review";
    for (const admin of hostel.admins) {
      await prisma.notification.create({
        data: {
          title: `Hostel ${statusText}`,
          message: `Your hostel "${hostel.name}" has been ${statusText} by the platform administrator.`,
          type: "VERIFICATION",
          userId: admin.id,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[HOSTEL_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

