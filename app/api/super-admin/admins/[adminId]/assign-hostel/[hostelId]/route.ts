import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params: __params }: { params: Promise<{ adminId: string; hostelId: string }> }) {
  const params = await __params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { adminId, hostelId } = params;

    // Check if admin exists
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      include: {
        hostels: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 });
    }

    // Check if hostel exists
    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel) {
      return NextResponse.json(
        { message: "Hostel not found" },
        { status: 404 }
      );
    }

    // Remove the specific hostel assignment
    const updatedAdmin = await prisma.user.update({
      where: { id: adminId },
      data: {
        hostels: {
          disconnect: [{ id: hostelId }],
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
    console.error("Error removing hostel from admin:", error);
    return NextResponse.json(
      { message: "Failed to remove hostel from admin" },
      { status: 500 }
    );
  }
}
