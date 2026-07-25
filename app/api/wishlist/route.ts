import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import logger from "@/lib/logger";

// GET user's wishlist
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wishlists = await prisma.wishlist.findMany({
      where: { userId: user.id },
      include: {
        hostel: {
          include: {
            rooms: {
              select: {
                id: true,
                roomType: true,
                price: true,
                status: true,
              },
            },
            reviews: {
              select: { rating: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to include computed fields
    const data = wishlists.map((w: any) => {
      const averageRating =
        w.hostel.reviews.length > 0
          ? w.hostel.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
            w.hostel.reviews.length
          : 0;

      return {
        id: w.id,
        createdAt: w.createdAt,
        hostel: {
          ...w.hostel,
          averageRating,
          reviewCount: w.hostel.reviews.length,
          availableRooms: w.hostel.rooms.filter((r: any) => r.status === "AVAILABLE").length,
          lowestPrice:
            w.hostel.rooms.length > 0
              ? Math.min(...w.hostel.rooms.map((r: any) => r.price))
              : 0,
          totalRooms: w.hostel.rooms.length,
          reviews: undefined,
        },
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    logger.error("Error fetching wishlist", "WISHLIST_GET", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

// POST add/remove hostel from wishlist (toggle)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hostelId } = await req.json();

    if (!hostelId) {
      return NextResponse.json(
        { error: "hostelId is required" },
        { status: 400 }
      );
    }

    // Check if already in wishlist
    const existing = await prisma.wishlist.findUnique({
      where: { userId_hostelId: { userId: user.id, hostelId } },
    });

    if (existing) {
      // Toggle: remove from wishlist
      await prisma.wishlist.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ action: "removed", hostelId });
    }

    // Add to wishlist
    const wishlist = await prisma.wishlist.create({
      data: { userId: user.id, hostelId },
    });

    return NextResponse.json({ action: "added", id: wishlist.id, hostelId }, { status: 201 });
  } catch (error) {
    logger.error("Error updating wishlist", "WISHLIST_POST", error);
    return NextResponse.json(
      { error: "Failed to update wishlist" },
      { status: 500 }
    );
  }
}
