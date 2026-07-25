import { NextResponse } from "next/server";
import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import { paymentProvider } from "@/lib/payments";
import { runtime } from "@/config";

export { runtime };

function computeEndDate(plan: "MONTHLY" | "YEARLY", from = new Date()) {
  const end = new Date(from);
  if (plan === "MONTHLY") end.setMonth(end.getMonth() + 1);
  else end.setFullYear(end.getFullYear() + 1);
  return end;
}

// Stripe is the only writer of Subscription.status/endDate and booking
// Payment.status — never trust a client redirect for either, only this
// signed webhook.
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = paymentProvider.constructWebhookEvent(rawBody, signature) as Stripe.Event;
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.type === "subscription") {
          await handleSubscriptionCheckout(session);
        } else if (session.metadata?.type === "booking_payment") {
          await handleBookingPaymentCheckout(session);
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubId: sub.id },
          data: { status: "CANCELLED" },
        });
        break;
      }
    }
  } catch (error) {
    console.error(`Error handling Stripe event ${event.type}:`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const hostelId = session.metadata?.hostelId;
  const plan = session.metadata?.plan as "MONTHLY" | "YEARLY" | undefined;
  if (!hostelId || !plan) return;

  await prisma.subscription.upsert({
    where: { hostelId },
    create: {
      hostelId,
      plan,
      status: "ACTIVE",
      startDate: new Date(),
      endDate: computeEndDate(plan),
      stripeCustomerId: session.customer as string | null,
      stripeSubId: session.subscription as string | null,
    },
    update: {
      plan,
      status: "ACTIVE",
      startDate: new Date(),
      endDate: computeEndDate(plan),
      stripeCustomerId: session.customer as string | null,
      stripeSubId: session.subscription as string | null,
    },
  });
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const subscription = await prisma.subscription.findFirst({ where: { stripeSubId: sub.id } });
  if (!subscription) return;

  const status = sub.status === "active" || sub.status === "trialing" ? "ACTIVE" : sub.status === "canceled" ? "CANCELLED" : "EXPIRED";
  const periodEndSeconds = sub.items.data[0]?.current_period_end;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status,
      ...(periodEndSeconds ? { endDate: new Date(periodEndSeconds * 1000) } : {}),
    },
  });
}

async function handleBookingPaymentCheckout(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.paymentId;
  if (!paymentId) return;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: { include: { payments: true } } },
  });
  if (!payment || payment.status === "COMPLETED") return;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "COMPLETED",
        stripePaymentIntentId: (session.payment_intent as string) ?? null,
      },
    });

    const { booking } = payment;

    if (booking.status === "PENDING") {
      await tx.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMED" } });
    }

    const totalPaid =
      booking.payments
        .filter((p) => p.status === "COMPLETED" && p.id !== paymentId)
        .reduce((sum, p) => sum + p.amount, 0) + payment.amount;

    if (totalPaid >= booking.totalPrice) {
      await tx.room.update({ where: { id: booking.roomId }, data: { status: "OCCUPIED" } });
    }

    await tx.notification.create({
      data: {
        title: "Payment received",
        message: `Your payment of ${payment.amount} was received.`,
        type: "PAYMENT",
        userId: booking.userId,
      },
    });
  });
}
