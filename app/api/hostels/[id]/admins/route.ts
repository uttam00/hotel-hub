import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { adminSchema } from "@/lib/validation_schema";

// GET all admins for a hostel
export async function GET(
  req: Request,
  { params: __params }: { params: Promise<{ id: string }> }) {
  const params = await __params;
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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
      },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found" }, { status: 404 });
    }

    return NextResponse.json(hostel.admins);
  } catch (error) {
    console.error("Error fetching hostel admins:", error);
    return NextResponse.json(
      { error: "Failed to fetch hostel admins" },
      { status: 500 }
    );
  }
}

// POST add an admin to a hostel
export async function POST(
  req: Request,
  { params: __params }: { params: Promise<{ id: string }> }) {
  const params = await __params;
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const hostel = await prisma.hostel.findUnique({
      where: { id: params.id },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found" }, { status: 404 });
    }

    const body = await req.json();
    const { userId } = adminSchema.parse(body);

    // Check if user exists and is a HOSTEL_ADMIN
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.role !== "HOSTEL_ADMIN") {
      return NextResponse.json(
        { error: "User must be a HOSTEL_ADMIN" },
        { status: 400 }
      );
    }

    // Add user as admin to hostel
    await prisma.hostel.update({
      where: { id: params.id },
      data: {
        admins: {
          connect: { id: userId },
        },
      },
    });

    return NextResponse.json({ message: "Admin added successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Error adding hostel admin:", error);
    return NextResponse.json(
      { error: "Failed to add hostel admin" },
      { status: 500 }
    );
  }
}

// DELETE remove an admin from a hostel
export async function DELETE(
  req: Request,
  { params: __params }: { params: Promise<{ id: string }> }) {
  const params = await __params;
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const hostel = await prisma.hostel.findUnique({
      where: { id: params.id },
      include: {
        admins: {
          where: { id: userId },
        },
      },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found" }, { status: 404 });
    }

    if (hostel.admins.length === 0) {
      return NextResponse.json(
        { error: "User is not an admin of this hostel" },
        { status: 400 }
      );
    }

    // Remove user as admin from hostel
    await prisma.hostel.update({
      where: { id: params.id },
      data: {
        admins: {
          disconnect: { id: userId },
        },
      },
    });

    return NextResponse.json({ message: "Admin removed successfully" });
  } catch (error) {
    console.error("Error removing hostel admin:", error);
    return NextResponse.json(
      { error: "Failed to remove hostel admin" },
      { status: 500 }
    );
  }
}
