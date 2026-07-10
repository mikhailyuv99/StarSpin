import type { BillingPlan } from "@/lib/billing";
import type { PricingMarket } from "@/lib/pricing-market";
import { EUR_TO_VND } from "@/lib/plan-pricing";
import type { PlanPricing } from "@/lib/plan-pricing";

function eurToVnd(eur: number): number {
  return Math.round(eur * EUR_TO_VND);
}

/** Multi-business add-on display prices (Stripe still charges EUR). */
export const MULTI_BUSINESS_PRICING_BY_MARKET: Record<PricingMarket, Record<BillingPlan, PlanPricing>> = {
  vn: {
    monthly: { eur: 49, vnd: eurToVnd(49) },
    quarterly: { eur: 109, vnd: eurToVnd(109) },
    annual: { eur: 352, vnd: eurToVnd(352) },
  },
  // French market prices TBD — placeholder values until Stripe products are created.
  fr: {
    monthly: { eur: 49, vnd: eurToVnd(49) },
    quarterly: { eur: 109, vnd: eurToVnd(109) },
    annual: { eur: 352, vnd: eurToVnd(352) },
  },
};

export function getMultiBusinessPricing(plan: BillingPlan, market: PricingMarket): PlanPricing {
  return MULTI_BUSINESS_PRICING_BY_MARKET[market][plan];
}
