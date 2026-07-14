"use client";

import { useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useI18n } from "@/i18n/client";
import { usePricingMarket } from "@/components/providers/PricingMarketProvider";
import { SubscribeNav } from "@/components/billing/SubscribeNav";
import type { BillingPlan } from "@/lib/billing";
import { multiBusinessPriceForPlan } from "@/lib/billing-display";
import { getStripeBrowser } from "@/lib/stripe-browser";
import "@/components/marketing/cadeo-styles.css";

function isSetupIntentSecret(clientSecret: string) {
  return clientSecret.startsWith("seti_");
}

function CheckoutSkeleton() {
  return (
    <div className="cadeo-checkout-skeleton" aria-hidden>
      <div className="cadeo-checkout-skeleton-line cadeo-checkout-skeleton-line--lg" />
      <div className="cadeo-checkout-skeleton-line" />
      <div className="cadeo-checkout-skeleton-line cadeo-checkout-skeleton-line--md" />
      <div className="cadeo-checkout-skeleton-btn" />
    </div>
  );
}

function MultiBusinessPaymentForm({
  plan,
  clientSecret,
  onReady,
}: {
  plan: BillingPlan;
  clientSecret: string;
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
    const result = isSetupIntentSecret(clientSecret)
      ? await stripe.confirmSetup({
          elements,
          confirmParams: { return_url: returnUrl },
          redirect: "if_required",
        })
      : await stripe.confirmPayment({
          elements,
          confirmParams: { return_url: returnUrl },
          redirect: "if_required",
        });

    if (result.error) {
      setError(result.error.message ?? t("billing.checkoutError"));
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
  initialClientSecret = null,
  initialError = null,
}: {
  plan: BillingPlan;
  publishableKey: string;
  initialClientSecret?: string | null;
  initialError?: string | null;
}) {
  const { t } = useI18n();
  const stripePromise = useMemo(() => getStripeBrowser(publishableKey), [publishableKey]);
  const [formReady, setFormReady] = useState(false);
  const clientSecret = initialClientSecret;
  const error = initialError;

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

          {error && <p className="cadeo-subscribe-btn-error">{error}</p>}

          {clientSecret && (
            <div className="cadeo-checkout-elements">
              {!formReady && (
                <div className="cadeo-checkout-loading-panel">
                  <CheckoutSkeleton />
                  <p className="cadeo-checkout-loading">{t("billing.checkoutPreparing")}</p>
                </div>
              )}
              <div className={formReady ? "cadeo-checkout-elements-ready" : "cadeo-checkout-elements-pending"}>
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
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
                    loader: "auto",
                  }}
                >
                  <MultiBusinessPaymentForm
                    plan={plan}
                    clientSecret={clientSecret}
                    onReady={() => setFormReady(true)}
                  />
                </Elements>
              </div>
            </div>
          )}

          {!clientSecret && !error && (
            <div className="cadeo-checkout-loading-panel">
              <CheckoutSkeleton />
              <p className="cadeo-checkout-loading">{t("billing.checkoutPreparing")}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
