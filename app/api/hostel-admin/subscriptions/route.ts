import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, authzErrorResponse } from "@/lib/authz";

// GET every hostel this admin manages together with its subscription status
// — backs the "Your Hostels" list on the profile page. Subscriptions are
// per-hostel, so there's no single "is this user Pro" answer; this returns
// the per-hostel breakdown instead.
export async function GET() {
  try {
    const user = await requireRole("HOSTEL_ADMIN");

    const hostels = await prisma.hostel.findMany({
      where: { admins: { some: { id: user.id } } },
      select: {
        id: true,
        name: true,
        subscription: {
          select: { plan: true, status: true, endDate: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const result = hostels.map((h) => {
      const isActive = !!h.subscription && h.subscription.status === "ACTIVE" && h.subscription.endDate > new Date();
      return {
        id: h.id,
        name: h.name,
        accessLevel: isActive ? ("FULL" as const) : ("LIMITED" as const),
        subscription: h.subscription,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error fetching admin's subscriptions:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}
