import prisma from "@/lib/prisma";
import type { SubscriptionPlan } from "@prisma/client";

/**
 * Subscription period arithmetic and webhook idempotency.
 *
 * Kept out of the webhook route so the rules are testable without constructing
 * Stripe events, and so nothing else in the app can invent its own notion of
 * "when does this subscription end".
 */

/** Adds one billing period to `from`. */
export function addPeriod(plan: SubscriptionPlan, from: Date): Date {
  const end = new Date(from);
  if (plan === "MONTHLY") end.setMonth(end.getMonth() + 1);
  else end.setFullYear(end.getFullYear() + 1);
  return end;
}

/**
 * The end date a renewal should produce.
 *
 * Renewing early must *extend* the subscription, not truncate it — so the new
 * period is measured from the existing end date whenever that is still in the
 * future, and from now only once it has lapsed.
 *
 * This is also what makes a replayed webhook harmless in the worst case: the
 * idempotency ledger is the primary defence, but even without it this function
 * no longer silently resets `startDate` to now on every duplicate delivery.
 */
export function renewalEndDate(
  plan: SubscriptionPlan,
  currentEnd: Date | null | undefined,
  now: Date = new Date()
): Date {
  const base = currentEnd && currentEnd > now ? currentEnd : now;
  return addPeriod(plan, base);
}

/**
 * Records a Stripe event id, returning false if it has already been handled.
 *
 * Stripe guarantees *at least once* delivery, not exactly once: retries after a
 * timeout, and occasional duplicates, are normal. The event id is the primary
 * key of ProcessedWebhookEvent, so the second insert violates the unique
 * constraint and we report "already seen" rather than applying the effect
 * twice. Previously a duplicate `checkout.session.completed` re-ran the
 * subscription upsert and handed out an extra billing period for free.
 */
export async function claimWebhookEvent(
  eventId: string,
  eventType: string
): Promise<boolean> {
  try {
    await prisma.processedWebhookEvent.create({
      data: { id: eventId, type: eventType },
    });
    return true;
  } catch (error: any) {
    // P2002 = unique constraint violation, i.e. we've processed this already.
    if (error?.code === "P2002") return false;
    throw error;
  }
}

/**
 * Releases a claim so a genuinely failed handler can be retried by Stripe.
 *
 * Without this, a handler that throws after the claim would be permanently
 * skipped on redelivery — the event would be marked done while its effect
 * never landed.
 */
export async function releaseWebhookEvent(eventId: string): Promise<void> {
  await prisma.processedWebhookEvent
    .delete({ where: { id: eventId } })
    .catch(() => {
      /* Already gone; nothing to release. */
    });
}
