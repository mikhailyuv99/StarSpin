"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { usePricingMarket } from "@/components/providers/PricingMarketProvider";
import { PlanPriceDisplay } from "@/components/billing/PlanPriceDisplay";
import { SubscribeButton } from "@/components/billing/SubscribeButton";
import type { BillingPlan, PricingTier } from "@/lib/billing";
import { marketingSubscribeForPlan } from "@/lib/billing-display";

const PLANS: BillingPlan[] = ["monthly", "quarterly", "annual"];
const TIERS: PricingTier[] = ["solo", "multi"];

export function PricingPlans({
  ctaClassName = "cadeo-btn cadeo-btn-purple cadeo-btn-lg",
  showTierName = true,
}: {
  ctaClassName?: string;
  showTierName?: boolean;
}) {
  const { t } = useI18n();
  const market = usePricingMarket();
  const [tier, setTier] = useState<PricingTier>("solo");
  const [plan, setPlan] = useState<BillingPlan>("monthly");

  const planLabel = (value: BillingPlan) => {
    if (value === "monthly") return t("marketing.pricingMonthly");
    if (value === "quarterly") return t("marketing.pricingQuarterly");
    return t("marketing.pricingAnnual");
  };

  const tierLabel = (value: PricingTier) =>
    value === "solo" ? t("marketing.pricingTierSolo") : t("marketing.pricingTierMulti");

  const tierDesc =
    tier === "solo" ? t("marketing.pricingTierSoloDesc") : t("marketing.pricingTierMultiDesc");

  return (
    <div className="cadeo-pricing-billing">
      <div
        className="cadeo-pricing-tier-toggle"
        role="tablist"
        aria-label={t("marketing.pricingTierToggleLabel")}
      >
        {TIERS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tier === value}
            className={`cadeo-pricing-tier-btn ${tier === value ? "cadeo-pricing-tier-btn--active" : ""}`}
            onClick={() => setTier(value)}
          >
            <span className="cadeo-pricing-tier-btn-label">{tierLabel(value)}</span>
            <span className="cadeo-pricing-tier-btn-sub">
              {value === "solo" ? t("marketing.pricingTierSoloShort") : t("marketing.pricingTierMultiShort")}
            </span>
          </button>
        ))}
      </div>

      {showTierName && (
        <div className="cadeo-pricing-tier-head" key={tier}>
          <h3 className="cadeo-pricing-name cadeo-pricing-name--tier">{tierLabel(tier)}</h3>
          <p className="cadeo-pricing-tier-desc">{tierDesc}</p>
        </div>
      )}

      <div className="cadeo-pricing-toggle cadeo-pricing-toggle--3" role="tablist" aria-label={t("marketing.pricingToggleLabel")}>
        {PLANS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={plan === value}
            className={`cadeo-pricing-toggle-btn ${plan === value ? "cadeo-pricing-toggle-btn--active" : ""}`}
            onClick={() => setPlan(value)}
          >
            {planLabel(value)}
            {value === "monthly" && (
              <span className="cadeo-pricing-save cadeo-pricing-save--spacer" aria-hidden>
                {t("marketing.pricingQuarterlyBadge")}
              </span>
            )}
            {value === "quarterly" && (
              <span className="cadeo-pricing-save">{t("marketing.pricingQuarterlyBadge")}</span>
            )}
            {value === "annual" && <span className="cadeo-pricing-save">{t("marketing.pricingAnnualBadge")}</span>}
          </button>
        ))}
      </div>

      <PlanPriceDisplay plan={plan} tier={tier} />

      <p className="cadeo-pricing-trial">{t("marketing.pricingTrialNote")}</p>

      <p className="cadeo-pricing-wallets">{t("marketing.pricingWallets")}</p>

      <SubscribeButton plan={plan} tier={tier} className={ctaClassName}>
        {marketingSubscribeForPlan(plan, market, t, tier)}
      </SubscribeButton>
    </div>
  );
}
