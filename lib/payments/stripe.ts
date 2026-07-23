import Stripe from "stripe";
import type { PaymentProvider } from "./provider";
import { PLAN_PRICES, CURRENCY } from "./provider";

// Lazily constructed so a missing env var fails the one request that needed
// it, not the whole module at import/build time (see lib/authz.ts fixes to
// app/api/super-admin/admins/route.ts for the bug this avoids).
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

const toMinorUnits = (amount: number) => Math.round(amount * 100);
const fromMinorUnits = (amount: number) => amount / 100;

export const stripeProvider: PaymentProvider = {
  async createSubscriptionCheckout({ hostelId, plan, customerEmail, successUrl, cancelUrl }) {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            unit_amount: toMinorUnits(PLAN_PRICES[plan]),
            recurring: { interval: plan === "MONTHLY" ? "month" : "year" },
            product_data: { name: `HostelHub ${plan === "MONTHLY" ? "Monthly" : "Yearly"} Plan` },
          },
          quantity: 1,
        },
      ],
      metadata: { type: "subscription", hostelId, plan },
      subscription_data: { metadata: { type: "subscription", hostelId, plan } },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return { url: session.url! };
  },

  async createBookingPaymentCheckout({ paymentId, amount, description, customerEmail, successUrl, cancelUrl }) {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            unit_amount: toMinorUnits(amount),
            product_data: { name: description },
          },
          quantity: 1,
        },
      ],
      metadata: { type: "booking_payment", paymentId },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return { url: session.url! };
  },

  async refund({ paymentIntentId, amount, reason }) {
    const refund = await getStripe().refunds.create({
      payment_intent: paymentIntentId,
      ...(amount ? { amount: toMinorUnits(amount) } : {}),
      ...(reason ? { metadata: { reason } } : {}),
    });
    return { refundId: refund.id };
  },

  constructWebhookEvent(payload, signature) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    return getStripe().webhooks.constructEvent(payload, signature, secret);
  },
};

export { fromMinorUnits };
