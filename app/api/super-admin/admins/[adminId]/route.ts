import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params: __params }: { params: Promise<{ adminId: string }> }) {
  const params = await __params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { adminId } = params;

    // Check if admin exists
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 });
    }

    // Check if the user is actually an admin
    if (admin.role !== "HOSTEL_ADMIN" && admin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "User is not an admin" },
        { status: 400 }
      );
    }

    // Delete the admin
    await prisma.user.delete({
      where: { id: adminId },
    });

    return NextResponse.json({ message: "Admin deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return NextResponse.json(
      { message: "Failed to delete admin" },
      { status: 500 }
    );
  }
}
