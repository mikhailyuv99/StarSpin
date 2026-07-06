"use client";

import { useI18n } from "@/i18n/client";
import type { BillingPlan } from "@/lib/billing";
import { marketingPeriodForPlan } from "@/lib/billing-display";
import { PLAN_PRICING, formatPlanEur, formatPlanVnd } from "@/lib/plan-pricing";

type PlanPriceDisplayProps = {
  plan: BillingPlan;
  className?: string;
  priceClassName?: string;
  periodClassName?: string;
  eurClassName?: string;
};

export function PlanPriceDisplay({
  plan,
  className = "cadeo-pricing-amount",
  priceClassName = "cadeo-pricing-price",
  periodClassName = "cadeo-pricing-period",
  eurClassName = "cadeo-pricing-eur",
}: PlanPriceDisplayProps) {
  const { t } = useI18n();
  const pricing = PLAN_PRICING[plan];
  const periodLabel = marketingPeriodForPlan(plan, t);

  return (
    <div className={className}>
      <div className="cadeo-pricing-vnd-line">
        <span className={priceClassName}>{formatPlanVnd(pricing.vnd)}</span>
        <span className={periodClassName}> {periodLabel}</span>
      </div>
      <p className={eurClassName}>{formatPlanEur(pricing.eur)}</p>
    </div>
  );
}
