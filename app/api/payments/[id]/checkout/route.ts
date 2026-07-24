import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser, authzErrorResponse } from "@/lib/authz";
import { paymentProvider } from "@/lib/payments";

// POST resume checkout for an existing PENDING payment (e.g. the student
// abandoned Stripe Checkout last time). Never creates a new Payment row —
// that would double-count against the booking's remaining balance.
export async function POST(_req: Request, { params: __params }: { params: Promise<{ id: string }> }) {
  const params = await __params;
  try {
    const user = await requireUser();

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: { booking: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.booking.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only a pending payment can be paid" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const { url } = await paymentProvider.createBookingPaymentCheckout({
      paymentId: payment.id,
      amount: payment.amount,
      description: payment.description || `Rent payment for booking ${payment.bookingId}`,
      customerEmail: user.email!,
      successUrl: `${baseUrl}/dashboard/payments?checkout=success`,
      cancelUrl: `${baseUrl}/dashboard/payments?checkout=cancelled`,
    });

    return NextResponse.json({ url });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error resuming payment checkout:", error);
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
  }
}
