import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { createHostelSchema } from "@/lib/validation_schema";


// GET all hostels
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const minPrice = searchParams.get("minPrice")
      ? Number.parseFloat(searchParams.get("minPrice") as string)
      : null;
    const maxPrice = searchParams.get("maxPrice")
      ? Number.parseFloat(searchParams.get("maxPrice") as string)
      : null;
    const amenities = searchParams.get("amenities")
      ? (searchParams.get("amenities") as string).split(",")
      : null;
    const availability = searchParams.get("availability");
    const sort = searchParams.get("sort"); // price_asc, price_desc, rating
    const limit = searchParams.get("limit")
      ? Number.parseInt(searchParams.get("limit") as string)
      : 10;
    const page = searchParams.get("page")
      ? Number.parseInt(searchParams.get("page") as string)
      : 1;
    const skip = (page - 1) * limit;

    const where: Prisma.HostelWhereInput = {
      status: "ACTIVE" as any,
      ...(city
        ? {
            city: {
              contains: city,
              mode: Prisma.QueryMode.insensitive,
            },
          }
        : {}),
      ...(amenities && amenities.length > 0
        ? { amenities: { hasEvery: amenities } }
        : {}),
      ...(availability === "available"
        ? { rooms: { some: { isAvailable: true } } }
        : {}),
    };

    // Determine sort order
    let orderBy: any = { createdAt: "desc" as const };
    if (sort === "rating") {
      // We'll sort in-memory after computing average rating
    }

    const hostels = await prisma.hostel.findMany({
      where,
      include: {
        rooms: {
          select: {
            id: true,
            roomType: true,
            price: true,
            isAvailable: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
          },
        },
        admins: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Calculate average rating and compute fields
    let hostelsWithRating = hostels.map((hostel) => {
      const totalRatings = hostel.reviews.reduce(
        (sum: number, review: { rating: number }) => sum + review.rating,
        0
      );
      const averageRating =
        hostel.reviews.length > 0 ? totalRatings / hostel.reviews.length : 0;
      const availableRooms = hostel.rooms.filter(
        (room: { isAvailable: boolean }) => room.isAvailable
      ).length;
      const lowestPrice =
        hostel.rooms.length > 0
          ? Math.min(
              ...hostel.rooms.map((room: { price: number }) => room.price)
            )
          : 0;

      return {
        ...hostel,
        averageRating,
        reviewCount: hostel.reviews.length,
        availableRooms,
        lowestPrice,
        totalRooms: hostel.rooms.length,
        reviews: undefined,
      };
    });

    // Post-filter by price range (computed from rooms)
    if (minPrice !== null) {
      hostelsWithRating = hostelsWithRating.filter(
        (h) => h.lowestPrice >= minPrice
      );
    }
    if (maxPrice !== null) {
      hostelsWithRating = hostelsWithRating.filter(
        (h) => h.lowestPrice <= maxPrice
      );
    }

    // Sort
    if (sort === "price_asc") {
      hostelsWithRating.sort((a, b) => a.lowestPrice - b.lowestPrice);
    } else if (sort === "price_desc") {
      hostelsWithRating.sort((a, b) => b.lowestPrice - a.lowestPrice);
    } else if (sort === "rating") {
      hostelsWithRating.sort((a, b) => b.averageRating - a.averageRating);
    }

    // Paginate after filtering
    const total = hostelsWithRating.length;
    const paginated = hostelsWithRating.slice(skip, skip + limit);

    return NextResponse.json({
      hostels: paginated,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching hostels:", error);
    // Return more detailed error information
    return NextResponse.json(
      {
        error: "Failed to fetch hostels",
        details: error instanceof Error ? error.message : String(error),
        stack:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.stack
              : undefined
            : undefined,
      },
      { status: 500 }
    );
  }
}

// POST create a new hostel
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (
      !user ||
      (user.role !== "HOSTEL_ADMIN" && user.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = createHostelSchema.parse(body);

    const hostel = await prisma.hostel.create({
      data: {
        ...validatedData,
        admins: {
          connect: { id: user.id },
        },
      },
    });

    return NextResponse.json(hostel, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Error creating hostel:", error);
    return NextResponse.json(
      { error: "Failed to create hostel" },
      { status: 500 }
    );
  }
}
