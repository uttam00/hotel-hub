import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, authzErrorResponse } from "@/lib/authz";
import { getRevenueTrend } from "@/lib/analytics";

// GET platform-wide occupancy, revenue trend, and booking funnel
export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");

    const [totalRooms, occupiedRooms, bookingCounts, revenueTrend, activeSubscriptions] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { status: "OCCUPIED" } }),
      prisma.booking.groupBy({ by: ["status"], _count: true }),
      getRevenueTrend({}),
      prisma.subscription.count({ where: { status: "ACTIVE", endDate: { gt: new Date() } } }),
    ]);

    return NextResponse.json({
      occupancy: {
        total: totalRooms,
        occupied: occupiedRooms,
        rate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      },
      bookingFunnel: bookingCounts.map((b) => ({ status: b.status, count: b._count })),
      revenueTrend,
      activeSubscriptions,
    });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error fetching platform analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
