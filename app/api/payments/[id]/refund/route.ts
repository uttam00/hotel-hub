import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireUser, authzErrorResponse } from "@/lib/authz";
import { paymentProvider } from "@/lib/payments";
import { logAudit } from "@/lib/audit";

const refundSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().min(1).optional(),
});

// POST refund a completed payment. Hostel admins/super admins only — this
// executes a real Stripe refund, it isn't a request/approval queue.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        booking: {
          include: { room: { include: { hostel: { include: { admins: { where: { id: user.id } } } } } } },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const isHostelAdmin = payment.booking.room.hostel.admins.length > 0;
    if (user.role !== "SUPER_ADMIN" && !(user.role === "HOSTEL_ADMIN" && isHostelAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (payment.status !== "COMPLETED" || !payment.stripePaymentIntentId) {
      return NextResponse.json(
        { error: "Only a completed, gateway-processed payment can be refunded" },
        { status: 400 }
      );
    }

    const { amount, reason } = refundSchema.parse(await req.json().catch(() => ({})));

    await paymentProvider.refund({
      paymentIntentId: payment.stripePaymentIntentId,
      amount,
      reason,
    });

    const updated = await prisma.payment.update({
      where: { id: params.id },
      data: {
        status: "REFUNDED",
        refundedAmount: amount ?? payment.amount,
        refundReason: reason,
      },
    });

    await logAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "PAYMENT_REFUNDED",
      entityType: "Payment",
      entityId: payment.id,
      metadata: { amount: amount ?? payment.amount, reason },
    });

    await prisma.notification.create({
      data: {
        title: "Payment refunded",
        message: `Your payment of ${payment.amount} has been refunded.`,
        type: "PAYMENT",
        userId: payment.booking.userId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }

    console.error("Error processing refund:", error);
    return NextResponse.json({ error: "Failed to process refund" }, { status: 500 });
  }
}
