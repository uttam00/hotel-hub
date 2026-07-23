import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import logger from "@/lib/logger";

// GET notifications for the current user
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = searchParams.get("limit")
      ? Number.parseInt(searchParams.get("limit") as string)
      : 20;
    const page = searchParams.get("page")
      ? Number.parseInt(searchParams.get("page") as string)
      : 1;
    const skip = (page - 1) * limit;

    const where: any = { userId: user.id };
    if (unreadOnly) {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.notification.count({ where });
    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    logger.error("Error fetching notifications", "NOTIFICATIONS_GET", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST create a notification (admin-only or system)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "HOSTEL_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { title, message, type, userId } = body;

    if (!title || !message || !userId) {
      return NextResponse.json(
        { error: "title, message, and userId are required" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type || "GENERAL",
        userId,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    logger.error("Error creating notification", "NOTIFICATIONS_POST", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}
