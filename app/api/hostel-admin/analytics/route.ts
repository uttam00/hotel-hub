import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, requireHostelAccess, authzErrorResponse } from "@/lib/authz";
import { getRevenueTrend } from "@/lib/analytics";

// GET occupancy, revenue trend, and booking funnel for a hostel the admin manages
export async function GET(req: Request) {
  try {
    const user = await requireRole("HOSTEL_ADMIN", "SUPER_ADMIN");

    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get("hostelId");
    if (!hostelId) {
      return NextResponse.json({ error: "hostelId is required" }, { status: 400 });
    }
    await requireHostelAccess(user.id, user.role, hostelId);

    const [totalRooms, occupiedRooms, bookingCounts, revenueTrend] = await Promise.all([
      prisma.room.count({ where: { hostelId } }),
      prisma.room.count({ where: { hostelId, status: "OCCUPIED" } }),
      prisma.booking.groupBy({
        by: ["status"],
        where: { room: { hostelId } },
        _count: true,
      }),
      getRevenueTrend({ booking: { room: { hostelId } } }),
    ]);

    return NextResponse.json({
      occupancy: {
        total: totalRooms,
        occupied: occupiedRooms,
        rate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      },
      bookingFunnel: bookingCounts.map((b) => ({ status: b.status, count: b._count })),
      revenueTrend,
    });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
