import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, requireHostelAccess, authzErrorResponse } from "@/lib/authz";

// GET dashboard counts for one hostel — same figures the dashboard used to
// compute inline for `hostels[0]`, now parameterized so the hostel selector
// can drive them.
export async function GET(req: Request) {
  try {
    const user = await requireRole("HOSTEL_ADMIN");

    const hostelId = new URL(req.url).searchParams.get("hostelId");
    if (!hostelId) {
      return NextResponse.json({ error: "hostelId is required" }, { status: 400 });
    }
    await requireHostelAccess(user.id, user.role, hostelId);

    const [totalStudents, totalBookings, totalPayments, totalRooms, availableRooms] = await Promise.all([
      prisma.user.count({
        where: {
          role: "STUDENT",
          bookings: { some: { room: { hostelId } } },
        },
      }),
      prisma.booking.count({ where: { room: { hostelId } } }),
      prisma.payment.count({ where: { booking: { room: { hostelId } } } }),
      prisma.room.count({ where: { hostelId } }),
      prisma.room.count({ where: { hostelId, isAvailable: true } }),
    ]);

    return NextResponse.json({
      totalStudents,
      totalBookings,
      totalPayments,
      totalRooms,
      availableRooms,
      occupiedRooms: totalRooms - availableRooms,
    });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error fetching hostel-admin stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
