"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { SubscribeButton } from "@/components/billing/SubscribeButton";
import type { BillingPlan } from "@/lib/billing";
import {
  marketingPeriodForPlan,
  marketingPriceForPlan,
  marketingSubscribeForPlan,
} from "@/lib/billing-display";

const PLANS: BillingPlan[] = ["monthly", "quarterly", "annual"];

export function PricingPlans({ ctaClassName = "cadeo-btn cadeo-btn-purple cadeo-btn-lg" }: { ctaClassName?: string }) {
  const { t } = useI18n();
  const [plan, setPlan] = useState<BillingPlan>("monthly");

  const planLabel = (value: BillingPlan) => {
    if (value === "monthly") return t("marketing.pricingMonthly");
    if (value === "quarterly") return t("marketing.pricingQuarterly");
    return t("marketing.pricingAnnual");
  };

  return (
    <div className="cadeo-pricing-billing">
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
            {value === "annual" && <span className="cadeo-pricing-save">{t("marketing.pricingAnnualBadge")}</span>}
          </button>
        ))}
      </div>

      <div className="cadeo-pricing-amount">
        <span className="cadeo-pricing-price">{marketingPriceForPlan(plan, t)}</span>
        <span className="cadeo-pricing-period"> {marketingPeriodForPlan(plan, t)}</span>
      </div>

      <p className="cadeo-pricing-wallets">{t("marketing.pricingWallets")}</p>

      <SubscribeButton plan={plan} className={ctaClassName}>
        {marketingSubscribeForPlan(plan, t)}
      </SubscribeButton>
    </div>
  );
}
