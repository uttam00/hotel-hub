import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireRole, requireHostelAccess, authzErrorResponse } from "@/lib/authz";
import { attendanceSchema } from "@/lib/validation_schema";

// GET attendance for a hostel on a given date (defaults to today)
export async function GET(req: Request) {
  try {
    const user = await requireRole("HOSTEL_ADMIN", "SUPER_ADMIN");

    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get("hostelId");
    if (!hostelId) {
      return NextResponse.json({ error: "hostelId is required" }, { status: 400 });
    }
    await requireHostelAccess(user.id, user.role, hostelId);

    const dateParam = searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : new Date();
    const dayStart = new Date(date.toDateString());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const records = await prisma.attendance.findMany({
      where: { hostelId, date: { gte: dayStart, lt: dayEnd } },
      include: { student: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(records);
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

const markSchema = attendanceSchema.extend({ hostelId: z.string().min(1) });

// POST mark (or update) one student's attendance for a date
export async function POST(req: Request) {
  try {
    const user = await requireRole("HOSTEL_ADMIN", "SUPER_ADMIN");

    const body = markSchema.parse(await req.json());
    await requireHostelAccess(user.id, user.role, body.hostelId);

    const dayStart = new Date(body.date.toDateString());

    const record = await prisma.attendance.upsert({
      where: { studentId_date: { studentId: body.studentId, date: dayStart } },
      create: {
        studentId: body.studentId,
        hostelId: body.hostelId,
        date: dayStart,
        status: body.status,
        note: body.note,
        markedBy: user.id,
      },
      update: { status: body.status, note: body.note, markedBy: user.id },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }

    console.error("Error marking attendance:", error);
    return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 });
  }
}
