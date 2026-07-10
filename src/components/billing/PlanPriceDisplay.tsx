"use client";

import { useI18n } from "@/i18n/client";
import { usePricingMarket } from "@/components/providers/PricingMarketProvider";
import type { BillingPlan, PricingTier } from "@/lib/billing";
import { marketingPeriodForPlan, marketingPriceForPlan } from "@/lib/billing-display";

type PlanPriceDisplayProps = {
  plan: BillingPlan;
  tier?: PricingTier;
  className?: string;
  priceClassName?: string;
  periodClassName?: string;
  eurClassName?: string;
};

export function PlanPriceDisplay({
  plan,
  tier = "solo",
  className = "cadeo-pricing-amount",
  priceClassName = "cadeo-pricing-price",
  periodClassName = "cadeo-pricing-period",
}: PlanPriceDisplayProps) {
  const { t } = useI18n();
  const market = usePricingMarket();
  const periodLabel = marketingPeriodForPlan(plan, t);
  const amount = marketingPriceForPlan(plan, market, tier);

  return (
    <div className={className} key={`${tier}-${plan}`}>
      <div className="cadeo-pricing-vnd-line cadeo-pricing-vnd-line--animate">
        <span className={priceClassName}>{amount}</span>
        <span className={periodClassName}> {periodLabel}</span>
      </div>
    </div>
  );
}
