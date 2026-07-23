import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireUser, authzErrorResponse } from "@/lib/authz";
import { paymentSchema } from "@/lib/validation_schema";
import { paymentProvider } from "@/lib/payments";

// GET all payments for a booking
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        room: { include: { hostel: { include: { admins: { where: { id: user.id } } } } } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (
      (user.role === "STUDENT" && booking.userId !== user.id) ||
      (user.role === "HOSTEL_ADMIN" && booking.room.hostel.admins.length === 0)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const payments = await prisma.payment.findMany({
      where: { bookingId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

// POST start a real payment: creates a PENDING Payment record and a Stripe
// Checkout session for it. The Payment only ever becomes COMPLETED via the
// Stripe webhook (app/api/webhooks/stripe) — never here, and never from the
// client's redirect back to the success URL.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { user: true, payments: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { amount, method } = paymentSchema.parse(await req.json());

    const totalPaid = booking.payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid + amount > booking.totalPrice) {
      return NextResponse.json({ error: "Payment amount exceeds remaining balance" }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        amount,
        method,
        status: "PENDING",
        bookingId: params.id,
        description: `Rent payment for booking ${params.id}`,
      },
    });

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const { url } = await paymentProvider.createBookingPaymentCheckout({
      paymentId: payment.id,
      amount,
      description: payment.description!,
      customerEmail: user.email!,
      successUrl: `${baseUrl}/dashboard/payments?checkout=success`,
      cancelUrl: `${baseUrl}/dashboard/payments?checkout=cancelled`,
    });

    return NextResponse.json({ payment, url }, { status: 201 });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }

    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
