import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, authzErrorResponse } from "@/lib/authz";

// GET every hostel the current hostel admin manages — backs the hostel
// selector, unlike /api/hostel-admin/me which only returns the first one.
export async function GET() {
  try {
    const user = await requireRole("HOSTEL_ADMIN");

    const hostels = await prisma.hostel.findMany({
      where: { admins: { some: { id: user.id } } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(hostels);
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error fetching admin's hostels:", error);
    return NextResponse.json({ error: "Failed to fetch hostels" }, { status: 500 });
  }
}
