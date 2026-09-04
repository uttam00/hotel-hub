import { NextResponse } from "next/server";
import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import { paymentProvider } from "@/lib/payments";
import {
  addPeriod,
  claimWebhookEvent,
  releaseWebhookEvent,
  renewalEndDate,
} from "@/lib/billing";
import { runtime } from "@/config";

export { runtime };

/**
 * Stripe is the only writer of Subscription.status/endDate and booking
 * Payment.status — never trust a client redirect for either, only this signed
 * webhook.
 *
 * Delivery is at-least-once, so every event is claimed in an idempotency
 * ledger before its handler runs. A duplicate delivery is acknowledged with
 * 200 and does nothing; a handler that genuinely fails releases its claim so
 * Stripe's retry can pick it up again.
 */
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

  // Claim before doing any work. Returning 200 on a duplicate stops Stripe
  // retrying an event we have already applied.
  const claimed = await claimWebhookEvent(event.id, event.type);
  if (!claimed) {
    return NextResponse.json({ received: true, duplicate: true });
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
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }
      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
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
    // Let Stripe retry: drop the claim so the redelivery isn't skipped as a
    // duplicate of an event whose effect never actually landed.
    await releaseWebhookEvent(event.id);
    console.error(`Error handling Stripe event ${event.type}:`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const hostelId = session.metadata?.hostelId;
  const plan = session.metadata?.plan as "MONTHLY" | "YEARLY" | undefined;
  if (!hostelId || !plan) return;

  const existing = await prisma.subscription.findUnique({ where: { hostelId } });
  const now = new Date();

  // Renewing early extends the existing term rather than throwing away the
  // remaining days; renewing after a lapse starts from today.
  const endDate = renewalEndDate(plan, existing?.endDate, now);

  await prisma.subscription.upsert({
    where: { hostelId },
    create: {
      hostelId,
      plan,
      status: "ACTIVE",
      startDate: now,
      endDate: addPeriod(plan, now),
      stripeCustomerId: (session.customer as string) ?? null,
      stripeSubId: (session.subscription as string) ?? null,
    },
    update: {
      plan,
      status: "ACTIVE",
      // startDate is deliberately left alone: it records when this hostel first
      // subscribed, and resetting it on every renewal destroyed that history.
      endDate,
      stripeCustomerId: (session.customer as string) ?? existing?.stripeCustomerId ?? null,
      stripeSubId: (session.subscription as string) ?? existing?.stripeSubId ?? null,
    },
  });

  await notifyHostelAdmins(hostelId, {
    title: "Subscription active",
    message: `Your ${plan.toLowerCase()} plan is active until ${endDate.toDateString()}.`,
  });
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubId: sub.id },
  });
  if (!subscription) return;

  const status =
    sub.status === "active" || sub.status === "trialing"
      ? "ACTIVE"
      : sub.status === "canceled"
      ? "CANCELLED"
      : "EXPIRED";
  const periodEndSeconds = sub.items.data[0]?.current_period_end;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status,
      ...(periodEndSeconds ? { endDate: new Date(periodEndSeconds * 1000) } : {}),
    },
  });
}

/**
 * A checkout the customer abandoned. The PENDING Payment row is left in place
 * so the student can resume it, but it is marked FAILED if Stripe has closed
 * the session for good — otherwise dues lists fill with phantom pending
 * amounts that can never be collected.
 */
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.paymentId;
  if (!paymentId) return;

  await prisma.payment.updateMany({
    // Only touch it if still pending — never overwrite a completed payment.
    where: { id: paymentId, status: "PENDING" },
    data: { status: "FAILED" },
  });
}

async function handleBookingPaymentCheckout(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.paymentId;
  if (!paymentId) return;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: { include: { payments: true } } },
  });
  // Second guard beyond the event ledger: a different event could still
  // reference a payment that is already settled.
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
        message: `Your payment of ₹${payment.amount.toLocaleString("en-IN")} was received.`,
        type: "PAYMENT",
        userId: booking.userId,
      },
    });
  });
}

/** Notifies every admin of a hostel — used for subscription state changes. */
async function notifyHostelAdmins(
  hostelId: string,
  notification: { title: string; message: string }
) {
  const hostel = await prisma.hostel.findUnique({
    where: { id: hostelId },
    select: { admins: { select: { id: true } } },
  });
  if (!hostel || hostel.admins.length === 0) return;

  await prisma.notification.createMany({
    data: hostel.admins.map((admin) => ({
      ...notification,
      type: "SUBSCRIPTION" as const,
      userId: admin.id,
    })),
  });
}
