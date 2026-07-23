import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireRole, requireHostelAccess, authzErrorResponse } from "@/lib/authz";
import { visitorSchema } from "@/lib/validation_schema";

// GET visitors for a hostel the admin manages
export async function GET(req: Request) {
  try {
    const user = await requireRole("HOSTEL_ADMIN", "SUPER_ADMIN");

    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get("hostelId");
    if (!hostelId) {
      return NextResponse.json({ error: "hostelId is required" }, { status: 400 });
    }
    await requireHostelAccess(user.id, user.role, hostelId);

    const visitors = await prisma.visitor.findMany({
      where: { hostelId },
      include: { visitingStudent: { select: { id: true, name: true, email: true } } },
      orderBy: { checkInAt: "desc" },
      take: 100,
    });

    return NextResponse.json(visitors);
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error fetching visitors:", error);
    return NextResponse.json({ error: "Failed to fetch visitors" }, { status: 500 });
  }
}

const createVisitorSchema = visitorSchema.extend({ hostelId: z.string().min(1) });

// POST log a new visitor
export async function POST(req: Request) {
  try {
    const user = await requireRole("HOSTEL_ADMIN", "SUPER_ADMIN");

    const body = createVisitorSchema.parse(await req.json());
    await requireHostelAccess(user.id, user.role, body.hostelId);

    const visitor = await prisma.visitor.create({
      data: { ...body, loggedBy: user.id },
    });

    return NextResponse.json(visitor, { status: 201 });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }

    console.error("Error logging visitor:", error);
    return NextResponse.json({ error: "Failed to log visitor" }, { status: 500 });
  }
}
