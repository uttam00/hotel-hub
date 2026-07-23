import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser, authzErrorResponse } from "@/lib/authz";

// DELETE an emergency contact (owner only)
export async function DELETE(req: Request, { params }: { params: { contactId: string } }) {
  try {
    const user = await requireUser();

    const contact = await prisma.emergencyContact.findUnique({ where: { id: params.contactId } });
    if (!contact || contact.studentId !== user.id) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    await prisma.emergencyContact.delete({ where: { id: params.contactId } });

    return NextResponse.json({ message: "Contact removed" });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error removing emergency contact:", error);
    return NextResponse.json({ error: "Failed to remove contact" }, { status: 500 });
  }
}
