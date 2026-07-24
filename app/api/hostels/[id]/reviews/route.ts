import { NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { reviewSchema } from "@/lib/validation_schema"

// GET all reviews for a hostel
export async function GET(req: Request, { params: __params }: { params: Promise<{ id: string }> }) {
  const params = await __params;
  try {
    const { searchParams } = new URL(req.url)
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit") as string) : 10
    const page = searchParams.get("page") ? Number.parseInt(searchParams.get("page") as string) : 1
    const skip = (page - 1) * limit

    const reviews = await prisma.review.findMany({
      where: { hostelId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    })

    const total = await prisma.review.count({ where: { hostelId: params.id } })

    return NextResponse.json({
      reviews,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

// POST create a new review
export async function POST(req: Request, { params: __params }: { params: Promise<{ id: string }> }) {
  const params = await __params;
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if hostel exists
    const hostel = await prisma.hostel.findUnique({
      where: { id: params.id },
    })

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found" }, { status: 404 })
    }

    // Check if user has stayed at this hostel (has a completed booking)
    const hasStayed = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        status: "COMPLETED",
        room: {
          hostelId: params.id,
        },
      },
    })

    if (!hasStayed && user.role === "STUDENT") {
      return NextResponse.json(
        { error: "You can only review hostels where you have completed a stay" },
        { status: 403 },
      )
    }

    // Check if user has already reviewed this hostel
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: user.id,
        hostelId: params.id,
      },
    })

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this hostel" }, { status: 400 })
    }

    const body = await req.json()
    const validatedData = reviewSchema.parse(body)

    const review = await prisma.review.create({
      data: {
        ...validatedData,
        userId: user.id,
        hostelId: params.id,
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 })
    }
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}
