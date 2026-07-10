import type { BillingPlan } from "@/lib/billing";
import type { PricingMarket } from "@/lib/pricing-market";

export type PlanPricing = { vnd: number; eur: number };

/** Google FX reference (Jul 2026): 1 EUR = 30,034 VND */
export const EUR_TO_VND = 30_034;

function eurToVnd(eur: number): number {
  return Math.round(eur * EUR_TO_VND);
}

/** Display prices (Stripe still charges EUR). */
export const PLAN_PRICING_BY_MARKET: Record<PricingMarket, Record<BillingPlan, PlanPricing>> = {
  vn: {
    monthly: { eur: 34, vnd: eurToVnd(34) },
    quarterly: { eur: 76.5, vnd: eurToVnd(76.5) },
    annual: { eur: 244, vnd: eurToVnd(244) },
  },
  fr: {
    monthly: { eur: 57, vnd: eurToVnd(57) },
    quarterly: { eur: 128, vnd: eurToVnd(128) },
    annual: { eur: 409, vnd: eurToVnd(409) },
  },
};

/** @deprecated Use getPlanPricing(plan, market) */
export const PLAN_PRICING = PLAN_PRICING_BY_MARKET.vn;

export function getPlanPricing(plan: BillingPlan, market: PricingMarket): PlanPricing {
  return PLAN_PRICING_BY_MARKET[market][plan];
}

export function formatPlanVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPlanEur(amount: number): string {
  const formatted = Number.isInteger(amount)
    ? String(amount)
    : amount.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  return `${formatted}€`;
}
