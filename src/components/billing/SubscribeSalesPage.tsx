"use client";

import { Suspense } from "react";
import { useI18n } from "@/i18n/client";
import { DashboardBillingRedirect } from "@/components/billing/DashboardBillingRedirect";
import { PricingPlans } from "@/components/billing/PricingPlans";
import { SubscribeCheckoutAlert } from "@/components/billing/SubscribeCheckoutAlert";
import { SubscribeNav } from "@/components/billing/SubscribeNav";
import { SocialIconRow } from "@/components/icons/SocialIconRow";
import { AdvantageCopy } from "@/components/marketing/AdvantageCopy";
import { getMarketingAdvantages } from "@/lib/marketing-advantages";
import { Reveal } from "@/components/motion/Reveal";
import "@/components/marketing/cadeo-styles.css";

export function SubscribeSalesPage({ merchantName }: { merchantName: string }) {
  const { t } = useI18n();

  const features = [
    t("marketing.priceF1"),
    t("marketing.priceF2"),
    t("marketing.priceF3"),
    t("marketing.priceF4"),
    t("marketing.priceF5"),
    t("marketing.priceF6"),
    t("marketing.priceF7"),
    t("marketing.priceF8"),
  ];
  const sideAdv = getMarketingAdvantages(t);

  return (
    <div className="cadeo-page cadeo-page--subscribe">
      <Suspense fallback={null}>
        <DashboardBillingRedirect />
        <SubscribeCheckoutAlert />
      </Suspense>

      <SubscribeNav
        backHref="/dashboard"
        backLabel={t("billing.backDashboard")}
        backLabelShort={t("billing.backDashboardShort")}
      />

      <main>
        <section className="cadeo-section cadeo-subscribe-section">
          <div className="cadeo-section-inner">
            <Reveal className="cadeo-subscribe-hero" y={24}>
              <p className="cadeo-subscribe-kicker">{t("billing.pageKicker")}</p>
              <h1 className="cadeo-h2 cadeo-subscribe-title">{t("billing.pageTitle")}</h1>
              <p className="cadeo-sub cadeo-subscribe-lead">{t("billing.pageSubtitle")}</p>
              <span className="cadeo-subscribe-merchant">{merchantName}</span>
            </Reveal>

            <Reveal y={30}>
              <div className="cadeo-pricing-wrap cadeo-subscribe-pricing">
                <div className="cadeo-pricing-inner">
                  <div className="cadeo-pricing-side">
                    <h3>{t("marketing.advantagesTitle")}</h3>
                    <ul>
                      {sideAdv.map((item) => (
                        <li key={item.num}>
                          <span>🎯</span>
                          <AdvantageCopy title={item.title} desc={item.desc} />
                        </li>
                      ))}
                    </ul>
                    <p className="cadeo-subscribe-stripe-note">{t("billing.secureStripe")}</p>
                  </div>
                  <div className="cadeo-pricing-main">
                    <div className="cadeo-pricing-header">
                      <PricingPlans showTierName />
                    </div>
                    <p className="cadeo-pricing-includes">{t("marketing.pricingIncludes")}</p>
                    <div className="cadeo-pricing-features">
                      {features.map((f) => (
                        <div key={f} className="cadeo-check">
                          {f === t("marketing.priceF1") ? (
                            <span className="cadeo-check-social">
                              <span>{f}</span>
                              <SocialIconRow size={14} />
                            </span>
                          ) : (
                            f
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </div>
  );
}
