import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, requireHostelAccess, authzErrorResponse } from "@/lib/authz";

// GET students (via their bookings) for a hostel the admin manages.
// Row-per-booking rather than row-per-user so room/status/dates are
// directly available without a second aggregation pass.
export async function GET(req: Request) {
  try {
    const user = await requireRole("HOSTEL_ADMIN", "SUPER_ADMIN");

    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get("hostelId");
    if (!hostelId) {
      return NextResponse.json({ error: "hostelId is required" }, { status: 400 });
    }
    await requireHostelAccess(user.id, user.role, hostelId);

    const bookings = await prisma.booking.findMany({
      where: { room: { hostelId } },
      include: {
        user: { select: { id: true, name: true, email: true, phoneNumber: true } },
        room: { select: { id: true, roomNumber: true, roomType: true } },
      },
      orderBy: { checkIn: "desc" },
      take: 100,
    });

    return NextResponse.json(bookings);
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}
