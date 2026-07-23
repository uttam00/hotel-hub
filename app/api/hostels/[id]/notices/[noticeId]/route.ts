import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, requireHostelAccess, authzErrorResponse } from "@/lib/authz";

// DELETE a notice
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; noticeId: string } }
) {
  try {
    const user = await requireRole("HOSTEL_ADMIN", "SUPER_ADMIN");
    await requireHostelAccess(user.id, user.role, params.id);

    const notice = await prisma.notice.findUnique({ where: { id: params.noticeId } });
    if (!notice || notice.hostelId !== params.id) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    await prisma.notice.delete({ where: { id: params.noticeId } });

    return NextResponse.json({ message: "Notice deleted" });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error deleting notice:", error);
    return NextResponse.json({ error: "Failed to delete notice" }, { status: 500 });
  }
}
