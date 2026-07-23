import { stripeProvider } from "./stripe";
import type { PaymentProvider } from "./provider";

// The only place that names a concrete gateway. Every route imports
// `paymentProvider` from here, never `./stripe` directly.
export const paymentProvider: PaymentProvider = stripeProvider;
export { PLAN_PRICES, CURRENCY } from "./provider";
export type { PaymentProvider } from "./provider";
