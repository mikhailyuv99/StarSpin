"use client";

import { useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useI18n } from "@/i18n/client";
import { usePricingMarket } from "@/components/providers/PricingMarketProvider";
import { SubscribeNav } from "@/components/billing/SubscribeNav";
import { PlanPriceDisplay } from "@/components/billing/PlanPriceDisplay";
import type { BillingPlan } from "@/lib/billing";
import { checkoutPayForPlan } from "@/lib/billing-display";
import type { PricingMarket } from "@/lib/pricing-market";
import { getStripeBrowser } from "@/lib/stripe-browser";
import "@/components/marketing/cadeo-styles.css";

function currencyForMarket(market: PricingMarket): string {
  return market === "fr" ? "eur" : "vnd";
}

function CheckoutPaymentForm({
  plan,
  onReady,
}: {
  plan: BillingPlan;
  onReady: () => void;
}) {
  const { t } = useI18n();
  const market = usePricingMarket();
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const returnUrl = `${window.location.origin}/dashboard?billing=success`;

    // 1) Validate Payment Element fields (no Stripe subscription yet).
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? t("billing.checkoutError"));
      setSubmitting(false);
      return;
    }

    // 2) Create SetupIntent only (still no trial).
    const prepRes = await fetch("/api/stripe/subscription-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const prep = (await prepRes.json()) as {
      error?: string;
      clientSecret?: string;
      setupIntentId?: string;
    };
    if (!prepRes.ok || !prep.clientSecret || !prep.setupIntentId) {
      setError(prep.error ?? t("billing.checkoutError"));
      setSubmitting(false);
      return;
    }

    // 3) Apple Pay / Google Pay / 3DS / bank verification happens here.
    const { error: confirmError } = await stripe.confirmSetup({
      elements,
      clientSecret: prep.clientSecret,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });
    if (confirmError) {
      setError(confirmError.message ?? t("billing.checkoutError"));
      setSubmitting(false);
      return;
    }

    // 4) Only now create the trial — SetupIntent must be succeeded.
    const confirmRes = await fetch("/api/stripe/subscription-setup/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, setupIntentId: prep.setupIntentId }),
    });
    const confirmed = (await confirmRes.json()) as { error?: string };
    if (!confirmRes.ok) {
      setError(confirmed.error ?? t("billing.checkoutError"));
      setSubmitting(false);
      return;
    }

    window.location.assign(returnUrl);
  };

  return (
    <form onSubmit={handleSubmit} className="cadeo-checkout-form">
      <PaymentElement
        onReady={onReady}
        options={{
          layout: "tabs",
          paymentMethodOrder: ["apple_pay", "google_pay", "card"],
          wallets: {
            applePay: "auto",
            googlePay: "auto",
          },
        }}
      />
      {error && <p className="cadeo-subscribe-btn-error">{error}</p>}
      <button type="submit" disabled={!stripe || submitting} className="cadeo-btn cadeo-btn-purple cadeo-btn-lg">
        {submitting ? t("billing.checkoutProcessing") : checkoutPayForPlan(plan, market, t)}
      </button>
      <p className="cadeo-checkout-footnote">{t("billing.checkoutFootnote")}</p>
    </form>
  );
}

export function StarspinCheckout({
  merchantName,
  plan,
  publishableKey,
}: {
  merchantName: string;
  plan: BillingPlan;
  publishableKey: string;
}) {
  const { t } = useI18n();
  const market = usePricingMarket();
  const stripePromise = useMemo(() => getStripeBrowser(publishableKey), [publishableKey]);
  const [formReady, setFormReady] = useState(false);

  const elementsOptions = useMemo(
    () => ({
      mode: "setup" as const,
      currency: currencyForMarket(market),
      appearance: {
        theme: "stripe" as const,
        variables: {
          colorPrimary: "#9b7fe8",
          colorBackground: "#ffffff",
          colorText: "#0a0a0a",
          colorDanger: "#df1b41",
          borderRadius: "14px",
          fontFamily: "system-ui, sans-serif",
        },
        rules: {
          ".Label": { fontWeight: "700" },
        },
      },
      loader: "auto" as const,
    }),
    [market],
  );

  return (
    <div className="cadeo-page cadeo-page--subscribe cadeo-page--checkout">
      <SubscribeNav
        backHref="/subscribe"
        backLabel={t("billing.checkoutBack")}
        backLabelShort={t("billing.checkoutBackShort")}
      />

      <main className="cadeo-checkout-main">
        <div className="cadeo-checkout-card">
          <div className="cadeo-checkout-header">
            <p className="cadeo-checkout-kicker">{t("billing.pageKicker")}</p>
            <h1 className="cadeo-h2">{t("billing.checkoutTitle")}</h1>
            <p className="cadeo-sub">{t("billing.checkoutSubtitle")}</p>
            <span className="cadeo-subscribe-merchant">{merchantName}</span>
          </div>

          <div className="cadeo-checkout-summary">
            <p className="cadeo-checkout-plan">{t("marketing.pricingName")}</p>
            <PlanPriceDisplay
              plan={plan}
              className="cadeo-checkout-price-block"
              priceClassName="cadeo-checkout-price"
              periodClassName="cadeo-checkout-period"
              eurClassName="cadeo-checkout-eur"
            />
            <p className="cadeo-pricing-wallets">{t("marketing.pricingWallets")}</p>
          </div>

          <ul className="cadeo-checkout-trust">
            <li>{t("billing.secureStripe")}</li>
            <li>{t("marketing.pricingTrialNote")}</li>
          </ul>

          <div className="cadeo-checkout-elements">
            {!formReady && (
              <div className="cadeo-checkout-loading-panel">
                <div className="cadeo-checkout-skeleton" aria-hidden>
                  <div className="cadeo-checkout-skeleton-line cadeo-checkout-skeleton-line--lg" />
                  <div className="cadeo-checkout-skeleton-line" />
                  <div className="cadeo-checkout-skeleton-line cadeo-checkout-skeleton-line--md" />
                  <div className="cadeo-checkout-skeleton-btn" />
                </div>
                <p className="cadeo-checkout-loading">{t("billing.checkoutPreparing")}</p>
              </div>
            )}
            <div className={formReady ? "cadeo-checkout-elements-ready" : "cadeo-checkout-elements-pending"}>
              <Elements stripe={stripePromise} options={elementsOptions}>
                <CheckoutPaymentForm plan={plan} onReady={() => setFormReady(true)} />
              </Elements>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
