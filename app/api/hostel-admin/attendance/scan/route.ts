import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireRole, requireHostelAccess, authzErrorResponse } from "@/lib/authz";
import { verifyStudentToken } from "@/lib/qr";

const scanSchema = z.object({
  token: z.string().min(1),
  hostelId: z.string().min(1),
});

// POST mark today's attendance PRESENT from a scanned student QR code.
export async function POST(req: Request) {
  try {
    const user = await requireRole("HOSTEL_ADMIN", "SUPER_ADMIN");

    const { token, hostelId } = scanSchema.parse(await req.json());
    await requireHostelAccess(user.id, user.role, hostelId);

    const studentId = verifyStudentToken(token);
    if (!studentId) {
      return NextResponse.json({ error: "Invalid or tampered QR code" }, { status: 400 });
    }

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== "STUDENT") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const today = new Date(new Date().toDateString());

    const record = await prisma.attendance.upsert({
      where: { studentId_date: { studentId, date: today } },
      create: { studentId, hostelId, date: today, status: "PRESENT", markedBy: user.id },
      update: { status: "PRESENT", markedBy: user.id },
    });

    return NextResponse.json({ student: { id: student.id, name: student.name }, record });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }

    console.error("Error scanning attendance:", error);
    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 });
  }
}
