"use client";

import Link from "next/link";
import type { BillingPlan } from "@/lib/billing";
import { multiBusinessPriceForPlan } from "@/lib/billing-display";
import { usePricingMarket } from "@/components/providers/PricingMarketProvider";
import { useTranslations } from "@/i18n/client";
import { ui } from "@/components/ui/styles";

const PLANS: BillingPlan[] = ["monthly", "quarterly", "annual"];

export function MultiBusinessSubscribeCard() {
  const t = useTranslations();
  const market = usePricingMarket();

  return (
    <div className={`${ui.card} border-[var(--c-yellow)] bg-[var(--c-yellow-bright)]/40 space-y-4`}>
      <h2 className="text-base font-extrabold text-ink">{t("establishments.multiBusinessTitle")}</h2>
      <p className="text-sm text-muted">{t("establishments.multiBusinessBody")}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <Link
            key={plan}
            href={`/subscribe/multi-business?plan=${plan}`}
            className={`${ui.cardGrid} text-center !p-4`}
          >
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
              {plan === "monthly"
                ? t("marketing.pricingMonthly")
                : plan === "quarterly"
                  ? t("marketing.pricingQuarterly")
                  : t("marketing.pricingAnnual")}
            </p>
            <p className="mt-1 text-lg font-extrabold text-ink">
              {multiBusinessPriceForPlan(plan, market)}
            </p>
          </Link>
        ))}
      </div>
      <p className="text-xs font-semibold text-muted">{t("establishments.multiBusinessHint")}</p>
    </div>
  );
}
