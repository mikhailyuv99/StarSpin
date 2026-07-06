import type { BillingPlan } from "@/lib/billing";
import { PLAN_PRICING, formatPlanVnd } from "@/lib/plan-pricing";

type Translator = (key: string) => string;

export function marketingPriceForPlan(plan: BillingPlan): string {
  return formatPlanVnd(PLAN_PRICING[plan].vnd);
}

export function marketingPeriodForPlan(plan: BillingPlan, t: Translator): string {
  if (plan === "monthly") return t("marketing.pricingPeriodMonthly");
  if (plan === "quarterly") return t("marketing.pricingPeriodQuarterly");
  return t("marketing.pricingPeriodAnnual");
}

export function marketingSubscribeForPlan(plan: BillingPlan, t: Translator): string {
  const action =
    plan === "monthly"
      ? t("marketing.subscribeMonthly")
      : plan === "quarterly"
        ? t("marketing.subscribeQuarterly")
        : t("marketing.subscribeAnnual");
  return `${action} — ${formatPlanVnd(PLAN_PRICING[plan].vnd)}`;
}

export function checkoutPayForPlan(plan: BillingPlan, t: Translator): string {
  const action =
    plan === "monthly"
      ? t("billing.checkoutPayMonthly")
      : plan === "quarterly"
        ? t("billing.checkoutPayQuarterly")
        : t("billing.checkoutPayAnnual");
  return `${action} · ${formatPlanVnd(PLAN_PRICING[plan].vnd)}`;
}

export function managePlanLabelForPlan(plan: BillingPlan | null, t: Translator): string {
  if (plan === "monthly") return t("marketing.pricingMonthly");
  if (plan === "quarterly") return t("marketing.pricingQuarterly");
  if (plan === "annual") return t("marketing.pricingAnnual");
  return t("billing.managePlanUnknown");
}
