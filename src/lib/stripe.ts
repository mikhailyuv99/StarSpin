import Stripe from "stripe";
import type { BillingPlan } from "./billing";
import type { PricingMarket } from "./pricing-market";

export type { BillingPlan } from "./billing";
export { isBillingPlan } from "./billing";

const DEFAULT_MONTHLY_VN = "price_1ToRrQLdigJa0nWpx8uevojZ";
const DEFAULT_QUARTERLY_VN = "price_1TqBMoLdigJa0nWpclYOWf5X";
const DEFAULT_ANNUAL_VN = "price_1ToRssLdigJa0nWpw83MJwLW";

const DEFAULT_MONTHLY_FR = "price_1TrHSELdigJa0nWp25cuwWlp";
const DEFAULT_QUARTERLY_FR = "price_1TrHSuLdigJa0nWpqjHiovM3";
const DEFAULT_ANNUAL_FR = "price_1TrHU3LdigJa0nWpxVanWFWt";

/** Multi-business (Solo → Multi tier) Stripe price IDs. */
const DEFAULT_MULTI_MONTHLY_VN = "price_1TrawkLdigJa0nWpG6twMv86";
const DEFAULT_MULTI_QUARTERLY_VN = "price_1Trb18LdigJa0nWpGCOkm5wi";
const DEFAULT_MULTI_ANNUAL_VN = "price_1Trb1XLdigJa0nWpWwHuNiwW";
const DEFAULT_MULTI_MONTHLY_FR = "price_1Trb3ELdigJa0nWpIBUvP3gC";
const DEFAULT_MULTI_QUARTERLY_FR = "price_1Trb3cLdigJa0nWpMGRfycWH";
const DEFAULT_MULTI_ANNUAL_FR = "price_1Trb4ELdigJa0nWpjnf5KxYm";

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

export function getMonthlyPriceId(market: PricingMarket = "vn"): string {
  if (market === "fr") return process.env.STRIPE_PRICE_FR_MONTHLY ?? DEFAULT_MONTHLY_FR;
  return process.env.STRIPE_PRICE_MONTHLY ?? DEFAULT_MONTHLY_VN;
}

export function getQuarterlyPriceId(market: PricingMarket = "vn"): string {
  if (market === "fr") return process.env.STRIPE_PRICE_FR_QUARTERLY ?? DEFAULT_QUARTERLY_FR;
  return process.env.STRIPE_PRICE_QUARTERLY ?? DEFAULT_QUARTERLY_VN;
}

export function getAnnualPriceId(market: PricingMarket = "vn"): string {
  if (market === "fr") return process.env.STRIPE_PRICE_FR_ANNUAL ?? DEFAULT_ANNUAL_FR;
  return process.env.STRIPE_PRICE_ANNUAL ?? DEFAULT_ANNUAL_VN;
}

export function priceIdForPlan(plan: BillingPlan, market: PricingMarket): string {
  if (plan === "annual") return getAnnualPriceId(market);
  if (plan === "quarterly") return getQuarterlyPriceId(market);
  return getMonthlyPriceId(market);
}

export function marketFromPriceId(priceId: string): PricingMarket | null {
  if (
    priceId === getMonthlyPriceId("vn") ||
    priceId === getQuarterlyPriceId("vn") ||
    priceId === getAnnualPriceId("vn") ||
    priceId === getMultiBusinessMonthlyPriceId("vn") ||
    priceId === getMultiBusinessQuarterlyPriceId("vn") ||
    priceId === getMultiBusinessAnnualPriceId("vn")
  ) {
    return "vn";
  }
  if (
    priceId === getMonthlyPriceId("fr") ||
    priceId === getQuarterlyPriceId("fr") ||
    priceId === getAnnualPriceId("fr") ||
    priceId === getMultiBusinessMonthlyPriceId("fr") ||
    priceId === getMultiBusinessQuarterlyPriceId("fr") ||
    priceId === getMultiBusinessAnnualPriceId("fr")
  ) {
    return "fr";
  }
  return null;
}

export function getMultiBusinessMonthlyPriceId(market: PricingMarket = "vn"): string {
  if (market === "fr") return process.env.STRIPE_PRICE_FR_MULTI_MONTHLY ?? DEFAULT_MULTI_MONTHLY_FR;
  return process.env.STRIPE_PRICE_MULTI_MONTHLY ?? DEFAULT_MULTI_MONTHLY_VN;
}

export function getMultiBusinessQuarterlyPriceId(market: PricingMarket = "vn"): string {
  if (market === "fr") return process.env.STRIPE_PRICE_FR_MULTI_QUARTERLY ?? DEFAULT_MULTI_QUARTERLY_FR;
  return process.env.STRIPE_PRICE_MULTI_QUARTERLY ?? DEFAULT_MULTI_QUARTERLY_VN;
}

export function getMultiBusinessAnnualPriceId(market: PricingMarket = "vn"): string {
  if (market === "fr") return process.env.STRIPE_PRICE_FR_MULTI_ANNUAL ?? DEFAULT_MULTI_ANNUAL_FR;
  return process.env.STRIPE_PRICE_MULTI_ANNUAL ?? DEFAULT_MULTI_ANNUAL_VN;
}

export function multiBusinessPriceIdForPlan(plan: BillingPlan, market: PricingMarket): string {
  if (plan === "annual") return getMultiBusinessAnnualPriceId(market);
  if (plan === "quarterly") return getMultiBusinessQuarterlyPriceId(market);
  return getMultiBusinessMonthlyPriceId(market);
}

export function isMultiBusinessPriceId(priceId: string): boolean {
  return (
    priceId === getMultiBusinessMonthlyPriceId("vn") ||
    priceId === getMultiBusinessQuarterlyPriceId("vn") ||
    priceId === getMultiBusinessAnnualPriceId("vn") ||
    priceId === getMultiBusinessMonthlyPriceId("fr") ||
    priceId === getMultiBusinessQuarterlyPriceId("fr") ||
    priceId === getMultiBusinessAnnualPriceId("fr")
  );
}

export function subscriptionStatusFromStripe(
  status: Stripe.Subscription.Status,
): "active" | "trial" | "past_due" | "cancelled" {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid" || status === "incomplete") return "past_due";
  return "cancelled";
}
