"use client";

import { useI18n } from "@/i18n/client";
import { usePricingMarket } from "@/components/providers/PricingMarketProvider";
import type { BillingPlan } from "@/lib/billing";
import { marketingPeriodForPlan } from "@/lib/billing-display";
import { formatPlanEur, formatPlanVnd, getPlanPricing } from "@/lib/plan-pricing";

type PlanPriceDisplayProps = {
  plan: BillingPlan;
  className?: string;
  priceClassName?: string;
  periodClassName?: string;
  /** Kept for call-site compatibility; dual-currency display is intentionally disabled. */
  eurClassName?: string;
};

export function PlanPriceDisplay({
  plan,
  className = "cadeo-pricing-amount",
  priceClassName = "cadeo-pricing-price",
  periodClassName = "cadeo-pricing-period",
}: PlanPriceDisplayProps) {
  const { t } = useI18n();
  const market = usePricingMarket();
  const pricing = getPlanPricing(plan, market);
  const periodLabel = marketingPeriodForPlan(plan, t);
  const amount = market === "fr" ? formatPlanEur(pricing.eur) : formatPlanVnd(pricing.vnd);

  return (
    <div className={className}>
      <div className="cadeo-pricing-vnd-line">
        <span className={priceClassName}>{amount}</span>
        <span className={periodClassName}> {periodLabel}</span>
      </div>
    </div>
  );
}
