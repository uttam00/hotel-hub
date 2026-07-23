import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser, authzErrorResponse } from "@/lib/authz";
import logger from "@/lib/logger";

// GET payments for current user (role-aware). To create a payment, use
// POST /api/bookings/[id]/payments — the single source of truth for starting
// a payment, since it needs the booking to compute the remaining balance.
export async function GET(req: Request) {
  try {
    const user = await requireUser();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = searchParams.get("limit")
      ? Number.parseInt(searchParams.get("limit") as string)
      : 20;
    const page = searchParams.get("page")
      ? Number.parseInt(searchParams.get("page") as string)
      : 1;
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    const where: any = {};

    if (user.role === "STUDENT") {
      where.booking = { userId: user.id };
    } else if (user.role === "HOSTEL_ADMIN") {
      where.booking = {
        room: {
          hostel: {
            admins: { some: { id: user.id } },
          },
        },
      };
    }
    // SUPER_ADMIN sees all payments

    if (status) {
      where.status = status;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            room: {
              select: {
                id: true,
                roomNumber: true,
                roomType: true,
                price: true,
                hostel: {
                  select: {
                    id: true,
                    name: true,
                    city: true,
                    state: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.payment.count({ where });

    return NextResponse.json({
      payments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    logger.error("Error fetching payments", "PAYMENTS_GET", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
