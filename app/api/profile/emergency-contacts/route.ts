import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireUser, authzErrorResponse } from "@/lib/authz";
import { emergencyContactSchema } from "@/lib/validation_schema";

// GET the current user's emergency contacts
export async function GET() {
  try {
    const user = await requireUser();

    const contacts = await prisma.emergencyContact.findMany({
      where: { studentId: user.id },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(contacts);
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error fetching emergency contacts:", error);
    return NextResponse.json({ error: "Failed to fetch emergency contacts" }, { status: 500 });
  }
}

// POST add an emergency contact
export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const body = emergencyContactSchema.parse(await req.json());

    if (body.isPrimary) {
      await prisma.emergencyContact.updateMany({
        where: { studentId: user.id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.emergencyContact.create({
      data: { ...body, studentId: user.id },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }

    console.error("Error adding emergency contact:", error);
    return NextResponse.json({ error: "Failed to add emergency contact" }, { status: 500 });
  }
}
