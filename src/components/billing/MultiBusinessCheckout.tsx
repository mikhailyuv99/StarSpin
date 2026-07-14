"use client";

import { useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useI18n } from "@/i18n/client";
import { usePricingMarket } from "@/components/providers/PricingMarketProvider";
import { SubscribeNav } from "@/components/billing/SubscribeNav";
import type { BillingPlan } from "@/lib/billing";
import { multiBusinessPriceForPlan } from "@/lib/billing-display";
import type { PricingMarket } from "@/lib/pricing-market";
import { getStripeBrowser } from "@/lib/stripe-browser";
import "@/components/marketing/cadeo-styles.css";

function currencyForMarket(market: PricingMarket): string {
  return market === "fr" ? "eur" : "vnd";
}

function MultiBusinessPaymentForm({
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

    const returnUrl = `${window.location.origin}/dashboard/establishments?billing=success`;

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? t("billing.checkoutError"));
      setSubmitting(false);
      return;
    }

    const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({ elements });
    if (pmError || !paymentMethod) {
      setError(pmError?.message ?? t("billing.checkoutError"));
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/stripe/multi-business-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, paymentMethodId: paymentMethod.id }),
    });
    const data = (await res.json()) as {
      error?: string;
      clientSecret?: string | null;
    };

    if (!res.ok) {
      setError(data.error ?? t("billing.checkoutError"));
      setSubmitting(false);
      return;
    }

    if (data.clientSecret) {
      const { error: confirmError } = await stripe.confirmSetup({
        clientSecret: data.clientSecret,
        confirmParams: { return_url: returnUrl },
        redirect: "if_required",
      });
      if (confirmError) {
        setError(confirmError.message ?? t("billing.checkoutError"));
        setSubmitting(false);
        return;
      }
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
          wallets: { applePay: "auto", googlePay: "auto" },
        }}
      />
      {error && <p className="cadeo-subscribe-btn-error">{error}</p>}
      <button type="submit" disabled={!stripe || submitting} className="cadeo-btn cadeo-btn-purple cadeo-btn-lg">
        {submitting
          ? t("billing.checkoutProcessing")
          : `${t("establishments.subscribeCta")} · ${multiBusinessPriceForPlan(plan, market)}`}
      </button>
      <p className="cadeo-checkout-footnote">{t("billing.checkoutFootnote")}</p>
    </form>
  );
}

export function MultiBusinessCheckout({
  plan,
  publishableKey,
}: {
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
      paymentMethodCreation: "manual" as const,
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
        backHref="/dashboard/establishments"
        backLabel={t("establishments.backToList")}
        backLabelShort={t("establishments.backToListShort")}
      />
      <main className="cadeo-checkout-main">
        <div className="cadeo-checkout-card">
          <div className="cadeo-checkout-header">
            <h1 className="cadeo-h2">{t("establishments.checkoutTitle")}</h1>
            <p className="cadeo-sub">{t("establishments.checkoutSubtitle")}</p>
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
                <MultiBusinessPaymentForm plan={plan} onReady={() => setFormReady(true)} />
              </Elements>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
