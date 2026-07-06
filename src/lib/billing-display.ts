import type { BillingPlan } from "@/lib/billing";

type Translator = (key: string) => string;

export function marketingPriceForPlan(plan: BillingPlan, t: Translator): string {
  if (plan === "monthly") return t("marketing.pricingPriceMonthly");
  if (plan === "quarterly") return t("marketing.pricingPriceQuarterly");
  return t("marketing.pricingPriceAnnual");
}

export function marketingPeriodForPlan(plan: BillingPlan, t: Translator): string {
  if (plan === "monthly") return t("marketing.pricingPeriodMonthly");
  if (plan === "quarterly") return t("marketing.pricingPeriodQuarterly");
  return t("marketing.pricingPeriodAnnual");
}

export function marketingSubscribeForPlan(plan: BillingPlan, t: Translator): string {
  if (plan === "monthly") return t("marketing.subscribeMonthly");
  if (plan === "quarterly") return t("marketing.subscribeQuarterly");
  return t("marketing.subscribeAnnual");
}

export function checkoutPayForPlan(plan: BillingPlan, t: Translator): string {
  if (plan === "monthly") return t("billing.checkoutPayMonthly");
  if (plan === "quarterly") return t("billing.checkoutPayQuarterly");
  return t("billing.checkoutPayAnnual");
}

export function managePlanLabelForPlan(plan: BillingPlan | null, t: Translator): string {
  if (plan === "monthly") return t("marketing.pricingMonthly");
  if (plan === "quarterly") return t("marketing.pricingQuarterly");
  if (plan === "annual") return t("marketing.pricingAnnual");
  return t("billing.managePlanUnknown");
}
