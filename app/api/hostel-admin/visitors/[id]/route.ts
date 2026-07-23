import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireRole, requireHostelAccess, authzErrorResponse } from "@/lib/authz";

const updateSchema = z.object({
  checkOut: z.boolean().optional(),
  verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
});

// PATCH check a visitor out and/or update their verification status
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("HOSTEL_ADMIN", "SUPER_ADMIN");

    const visitor = await prisma.visitor.findUnique({ where: { id: params.id } });
    if (!visitor) {
      return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
    }
    await requireHostelAccess(user.id, user.role, visitor.hostelId);

    const { checkOut, verificationStatus } = updateSchema.parse(await req.json());

    const updated = await prisma.visitor.update({
      where: { id: params.id },
      data: {
        ...(checkOut ? { checkOutAt: new Date() } : {}),
        ...(verificationStatus ? { verificationStatus } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }

    console.error("Error updating visitor:", error);
    return NextResponse.json({ error: "Failed to update visitor" }, { status: 500 });
  }
}
