import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, authzErrorResponse } from "@/lib/authz";

// GET the hostel the current hostel admin manages — the common lookup every
// hostel-admin operational page (visitors, attendance, notices...) needs
// before it can scope its own query.
export async function GET() {
  try {
    const user = await requireRole("HOSTEL_ADMIN");

    const hostel = await prisma.hostel.findFirst({
      where: { admins: { some: { id: user.id } } },
      select: { id: true, name: true },
    });

    if (!hostel) {
      return NextResponse.json({ error: "No hostel found for this admin" }, { status: 404 });
    }

    return NextResponse.json(hostel);
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error fetching admin's hostel:", error);
    return NextResponse.json({ error: "Failed to fetch hostel" }, { status: 500 });
  }
}
