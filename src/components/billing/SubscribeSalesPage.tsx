"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useI18n } from "@/i18n/client";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { StarspinLogo } from "@/components/StarspinLogo";
import { SocialIconRow } from "@/components/icons/SocialIconRow";
import { PricingPlans } from "@/components/billing/PricingPlans";
import { DashboardBillingRedirect } from "@/components/billing/DashboardBillingRedirect";
import { SubscribeCheckoutAlert } from "@/components/billing/SubscribeCheckoutAlert";
import { MobileAppBanner } from "@/components/marketing/MobileAppBanner";
import { AdvantageCopy } from "@/components/marketing/AdvantageCopy";
import { getMarketingAdvantages } from "@/lib/marketing-advantages";
import { Reveal } from "@/components/motion/Reveal";
import "@/components/marketing/cadeo-styles.css";

export function SubscribeSalesPage({ merchantName }: { merchantName: string }) {
  const { t } = useI18n();

  const left = [
    t("marketing.priceF1"),
    t("marketing.priceF2"),
    t("marketing.priceF3"),
    t("marketing.priceF4"),
    t("marketing.priceF5"),
    t("marketing.priceF6"),
  ];
  const right = [
    t("marketing.priceF7"),
    t("marketing.priceF8"),
    t("marketing.priceF9"),
    t("marketing.priceF10"),
  ];
  const sideAdv = getMarketingAdvantages(t);

  return (
    <div className="cadeo-page cadeo-page--subscribe">
      <MobileAppBanner />
      <Suspense fallback={null}>
        <DashboardBillingRedirect />
        <SubscribeCheckoutAlert />
      </Suspense>

      <div className="cadeo-nav-wrap">
        <nav className="cadeo-nav">
          <StarspinLogo href="/dashboard" variant="light" size="md" />
          <div className="cadeo-nav-actions cadeo-subscribe-nav-actions">
            <Link href="/dashboard" className="cadeo-btn cadeo-btn-outline">
              {t("billing.backDashboard")}
            </Link>
            <LocaleSwitcher variant="brutal" />
          </div>
        </nav>
      </div>

      <main>
        <section className="cadeo-section cadeo-section--tight-top">
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
                      <h3 className="cadeo-pricing-name">{t("marketing.pricingName")}</h3>
                      <PricingPlans />
                    </div>
                    <p className="cadeo-pricing-includes">{t("marketing.pricingIncludes")}</p>
                    <div className="cadeo-pricing-features">
                      {[...left, ...right].map((f) => (
                        <div key={f} className="cadeo-check">
                          {f === t("marketing.priceF2") ? (
                            <span className="cadeo-check-social">
                              <span>{t("marketing.priceF2")}</span>
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
