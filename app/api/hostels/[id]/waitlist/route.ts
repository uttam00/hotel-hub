import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireUser, requireRole, requireHostelAccess, authzErrorResponse } from "@/lib/authz";
import { waitlistSchema } from "@/lib/validation_schema";

// GET the waitlist for a hostel (hostel admin / super admin only)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("HOSTEL_ADMIN", "SUPER_ADMIN");
    await requireHostelAccess(user.id, user.role, params.id);

    const entries = await prisma.waitlistEntry.findMany({
      where: { hostelId: params.id, status: { in: ["WAITING", "NOTIFIED"] } },
      include: { student: { select: { id: true, name: true, email: true } } },
      orderBy: { requestedAt: "asc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error fetching waitlist:", error);
    return NextResponse.json({ error: "Failed to fetch waitlist" }, { status: 500 });
  }
}

// POST join the waitlist for a room type at this hostel
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    const { roomType } = waitlistSchema.parse(await req.json());

    const existing = await prisma.waitlistEntry.findFirst({
      where: { hostelId: params.id, studentId: user.id, roomType, status: "WAITING" },
    });
    if (existing) {
      return NextResponse.json({ error: "You're already on the waitlist for this room type" }, { status: 409 });
    }

    const entry = await prisma.waitlistEntry.create({
      data: { hostelId: params.id, studentId: user.id, roomType },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }

    console.error("Error joining waitlist:", error);
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }
}
