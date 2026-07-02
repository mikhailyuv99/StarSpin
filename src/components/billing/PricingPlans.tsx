"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/client";
import { SubscribeButton } from "@/components/billing/SubscribeButton";
import type { BillingPlan } from "@/lib/billing";

export function PricingPlans({ ctaClassName = "cadeo-btn cadeo-btn-purple cadeo-btn-lg" }: { ctaClassName?: string }) {
  const { t } = useI18n();
  const [plan, setPlan] = useState<BillingPlan>("monthly");

  return (
    <div className="cadeo-pricing-billing">
      <div className="cadeo-pricing-toggle" role="tablist" aria-label={t("marketing.pricingToggleLabel")}>
        <button
          type="button"
          role="tab"
          aria-selected={plan === "monthly"}
          className={`cadeo-pricing-toggle-btn ${plan === "monthly" ? "cadeo-pricing-toggle-btn--active" : ""}`}
          onClick={() => setPlan("monthly")}
        >
          {t("marketing.pricingMonthly")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={plan === "annual"}
          className={`cadeo-pricing-toggle-btn ${plan === "annual" ? "cadeo-pricing-toggle-btn--active" : ""}`}
          onClick={() => setPlan("annual")}
        >
          {t("marketing.pricingAnnual")}
          <span className="cadeo-pricing-save">{t("marketing.pricingAnnualBadge")}</span>
        </button>
      </div>

      <div className="cadeo-pricing-amount">
        <span className="cadeo-pricing-price">
          {plan === "monthly" ? t("marketing.pricingPriceMonthly") : t("marketing.pricingPriceAnnual")}
        </span>
        <span className="cadeo-pricing-period">
          {" "}
          {plan === "monthly" ? t("marketing.pricingPeriodMonthly") : t("marketing.pricingPeriodAnnual")}
        </span>
      </div>

      <p className="cadeo-pricing-wallets">{t("marketing.pricingWallets")}</p>

      <SubscribeButton plan={plan} className={ctaClassName}>
        {plan === "monthly" ? t("marketing.subscribeMonthly") : t("marketing.subscribeAnnual")}
      </SubscribeButton>
    </div>
  );
}
