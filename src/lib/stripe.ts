import Stripe from "stripe";
import type { BillingPlan } from "./billing";

export type { BillingPlan } from "./billing";
export { isBillingPlan } from "./billing";

const DEFAULT_MONTHLY = "price_1ToRrQLdigJa0nWpx8uevojZ";
const DEFAULT_ANNUAL = "price_1ToRssLdigJa0nWpw83MJwLW";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key, {
    apiVersion: "2026-06-24.dahlia",
    typescript: true,
  });
}

export function getMonthlyPriceId(): string {
  return process.env.STRIPE_PRICE_MONTHLY ?? DEFAULT_MONTHLY;
}

export function getAnnualPriceId(): string {
  return process.env.STRIPE_PRICE_ANNUAL ?? DEFAULT_ANNUAL;
}

export function priceIdForPlan(plan: BillingPlan): string {
  return plan === "annual" ? getAnnualPriceId() : getMonthlyPriceId();
}

export function subscriptionStatusFromStripe(
  status: Stripe.Subscription.Status,
): "active" | "trial" | "past_due" | "cancelled" {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid" || status === "incomplete") return "past_due";
  return "cancelled";
}
