import type { BillingPlan, PricingTier } from "@/lib/billing";
import { formatPlanEur, formatPlanVnd, getPlanPricing } from "@/lib/plan-pricing";
import { getMultiBusinessPricing } from "@/lib/multi-business-pricing";
import type { PricingMarket } from "@/lib/pricing-market";

type Translator = (key: string) => string;

export function marketingPriceForPlan(
  plan: BillingPlan,
  market: PricingMarket,
  tier: PricingTier = "solo",
): string {
  const pricing = tier === "multi" ? getMultiBusinessPricing(plan, market) : getPlanPricing(plan, market);
  if (market === "fr") return formatPlanEur(pricing.eur);
  return formatPlanVnd(pricing.vnd);
}

export function marketingPeriodForPlan(plan: BillingPlan, t: Translator): string {
  if (plan === "monthly") return t("marketing.pricingPeriodMonthly");
  if (plan === "quarterly") return t("marketing.pricingPeriodQuarterly");
  return t("marketing.pricingPeriodAnnual");
}

export function marketingSubscribeForPlan(
  plan: BillingPlan,
  market: PricingMarket,
  t: Translator,
  tier: PricingTier = "solo",
): string {
  const action =
    plan === "monthly"
      ? t("marketing.subscribeMonthly")
      : plan === "quarterly"
        ? t("marketing.subscribeQuarterly")
        : t("marketing.subscribeAnnual");
  const tierLabel = tier === "multi" ? t("marketing.pricingTierMulti") : t("marketing.pricingTierSolo");
  return `${action} ${tierLabel} — ${marketingPriceForPlan(plan, market, tier)}`;
}

export function checkoutPayForPlan(
  plan: BillingPlan,
  market: PricingMarket,
  t: Translator,
  tier: PricingTier = "solo",
): string {
  const action =
    plan === "monthly"
      ? t("billing.checkoutPayMonthly")
      : plan === "quarterly"
        ? t("billing.checkoutPayQuarterly")
        : t("billing.checkoutPayAnnual");
  return `${action} · ${marketingPriceForPlan(plan, market, tier)}`;
}

export function managePlanLabelForPlan(plan: BillingPlan | null, t: Translator): string {
  if (plan === "monthly") return t("marketing.pricingMonthly");
  if (plan === "quarterly") return t("marketing.pricingQuarterly");
  if (plan === "annual") return t("marketing.pricingAnnual");
  return t("billing.managePlanUnknown");
}

export function multiBusinessPriceForPlan(plan: BillingPlan, market: PricingMarket): string {
  const pricing = getMultiBusinessPricing(plan, market);
  if (market === "fr") return formatPlanEur(pricing.eur);
  return formatPlanVnd(pricing.vnd);
}
