import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  { params: __params }: { params: Promise<{ adminId: string }> }) {
  const params = await __params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { adminId } = params;
    const { hostelIds } = await req.json();

    if (!hostelIds || !Array.isArray(hostelIds) || hostelIds.length === 0) {
      return NextResponse.json(
        { message: "At least one hostel ID is required" },
        { status: 400 }
      );
    }

    // Check if all hostels exist and are active
    const hostels = await prisma.hostel.findMany({
      where: { id: { in: hostelIds } },
    });

    if (hostels.length !== hostelIds.length) {
      return NextResponse.json(
        { message: "One or more hostels not found" },
        { status: 404 }
      );
    }

    // Check if admin exists and is actually an admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 });
    }

    if (admin.role !== "HOSTEL_ADMIN" && admin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "User is not an admin" },
        { status: 400 }
      );
    }

    // First, disconnect all existing hostel assignments
    await prisma.user.update({
      where: { id: adminId },
      data: {
        hostels: {
          set: [], // This will remove all existing hostel connections
        },
      },
    });

    // Then, connect the new hostel assignments
    const updatedAdmin = await prisma.user.update({
      where: { id: adminId },
      data: {
        hostels: {
          connect: hostelIds.map((id) => ({ id })),
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hostels: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedAdmin);
  } catch (error) {
    console.error("Error assigning hostels to admin:", error);
    return NextResponse.json(
      { message: "Failed to assign hostels to admin" },
      { status: 500 }
    );
  }
}
