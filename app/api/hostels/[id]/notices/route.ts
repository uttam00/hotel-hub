import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireRole, requireHostelAccess, authzErrorResponse } from "@/lib/authz";
import { requireFullAccess } from "@/lib/subscription";
import { noticeSchema } from "@/lib/validation_schema";

// GET active notices for a hostel (public — shown on the hostel's page)
export async function GET(req: Request, { params: __params }: { params: Promise<{ id: string }> }) {
  const params = await __params;
  try {
    const notices = await prisma.notice.findMany({
      where: {
        hostelId: params.id,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 20,
    });

    return NextResponse.json(notices);
  } catch (error) {
    console.error("Error fetching notices:", error);
    return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
  }
}

// POST create a notice — a premium feature, requires an active subscription.
export async function POST(req: Request, { params: __params }: { params: Promise<{ id: string }> }) {
  const params = await __params;
  try {
    const user = await requireRole("HOSTEL_ADMIN", "SUPER_ADMIN");
    await requireHostelAccess(user.id, user.role, params.id);
    if (user.role !== "SUPER_ADMIN") {
      await requireFullAccess(params.id);
    }

    const body = noticeSchema.parse(await req.json());

    const notice = await prisma.notice.create({
      data: {
        hostelId: params.id,
        title: body.title,
        body: body.body,
        pinned: body.pinned,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        createdBy: user.id,
      },
    });

    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }

    console.error("Error creating notice:", error);
    return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
  }
}
