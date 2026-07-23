import type { SubscriptionPlan } from "@prisma/client";

/**
 * Thin seam between business logic and whichever payment gateway is behind
 * it. Every route calls this interface, never the Stripe SDK directly — so
 * swapping providers (e.g. to Razorpay for UPI support) later is a new
 * implementation file, not a rewrite of every route that touches money.
 */
export interface PaymentProvider {
  /** Recurring checkout for a hostel admin buying/renewing a platform plan. */
  createSubscriptionCheckout(params: {
    hostelId: string;
    plan: SubscriptionPlan;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }>;

  /** One-time checkout for a student paying toward a booking. */
  createBookingPaymentCheckout(params: {
    paymentId: string;
    amount: number; // major currency unit (e.g. rupees), not paise/cents
    description: string;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }>;

  refund(params: {
    paymentIntentId: string;
    amount?: number; // major currency unit; omit for a full refund
    reason?: string;
  }): Promise<{ refundId: string }>;

  /** Verifies the raw webhook payload's signature and returns the parsed event. */
  constructWebhookEvent(payload: string | Buffer, signature: string): unknown;
}

export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  MONTHLY: 999,
  YEARLY: 9999,
};

export const CURRENCY = process.env.STRIPE_CURRENCY || "inr";
