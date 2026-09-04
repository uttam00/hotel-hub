import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, requireHostelAccess, authzErrorResponse } from "@/lib/authz";

/**
 * Dashboard figures for one hostel.
 *
 * Extended from plain row counts to the numbers a hostel is actually run by:
 * money collected, money outstanding, and today's arrivals/departures. The
 * previous version returned six counts, which could tell an owner how many
 * payments existed but not whether any money had arrived.
 *
 * Occupancy is intentionally NOT computed here — it is derived from room
 * capacity and bookings in lib/occupancy.ts, and having two definitions of
 * "occupied" (one here, one there) is exactly how dashboards start
 * contradicting the pages they link to.
 */
export async function GET(req: Request) {
  try {
    const user = await requireRole("HOSTEL_ADMIN");

    const hostelId = new URL(req.url).searchParams.get("hostelId");
    if (!hostelId) {
      return NextResponse.json({ error: "hostelId is required" }, { status: 400 });
    }
    await requireHostelAccess(user.id, user.role, hostelId);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const inHostel = { booking: { room: { hostelId } } };

    const [
      totalStudents,
      totalBookings,
      totalRooms,
      collectedToday,
      collectedThisMonth,
      collectedLastMonth,
      outstanding,
      overdue,
      arrivalsToday,
      departuresToday,
      visitorsOnPremises,
      expensesThisMonth,
      activeNotices,
      waitlistWaiting,
    ] = await Promise.all([
      prisma.user.count({
        where: { role: "STUDENT", bookings: { some: { room: { hostelId } } } },
      }),
      prisma.booking.count({ where: { room: { hostelId } } }),
      prisma.room.count({ where: { hostelId } }),

      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { ...inHostel, status: "COMPLETED", updatedAt: { gte: startOfToday } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { ...inHostel, status: "COMPLETED", updatedAt: { gte: startOfMonth } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          ...inHostel,
          status: "COMPLETED",
          updatedAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
      }),

      // Everything still owed, regardless of due date.
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { ...inHostel, status: "PENDING" },
      }),
      // The subset that is past its due date — the number that needs chasing.
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { ...inHostel, status: "PENDING", dueDate: { lt: now } },
      }),

      prisma.booking.count({
        where: {
          room: { hostelId },
          status: { in: ["CONFIRMED", "PENDING"] },
          checkIn: { gte: startOfToday, lt: startOfTomorrow },
        },
      }),
      prisma.booking.count({
        where: {
          room: { hostelId },
          status: { in: ["CONFIRMED", "COMPLETED"] },
          checkOut: { gte: startOfToday, lt: startOfTomorrow },
        },
      }),

      prisma.visitor.count({ where: { hostelId, checkOutAt: null } }),

      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { hostelId, date: { gte: startOfMonth } },
      }),

      prisma.notice.count({
        where: {
          hostelId,
          OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
        },
      }),

      prisma.waitlistEntry.count({ where: { hostelId, status: "WAITING" } }),
    ]);

    const thisMonth = collectedThisMonth._sum.amount ?? 0;
    const lastMonth = collectedLastMonth._sum.amount ?? 0;

    return NextResponse.json({
      totalStudents,
      totalBookings,
      totalRooms,

      collectedToday: collectedToday._sum.amount ?? 0,
      paymentsToday: collectedToday._count,
      collectedThisMonth: thisMonth,
      collectedLastMonth: lastMonth,
      // Null rather than 0 when there is no baseline: "+100%" against a month
      // with no collections at all would be a meaningless figure to show.
      collectionTrendPct:
        lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null,

      outstandingAmount: outstanding._sum.amount ?? 0,
      outstandingCount: outstanding._count,
      overdueAmount: overdue._sum.amount ?? 0,
      overdueCount: overdue._count,

      arrivalsToday,
      departuresToday,
      visitorsOnPremises,

      expensesThisMonth: expensesThisMonth._sum.amount ?? 0,
      netThisMonth: thisMonth - (expensesThisMonth._sum.amount ?? 0),

      activeNotices,
      waitlistWaiting,
    });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error fetching hostel-admin stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
