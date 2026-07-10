"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useI18n } from "@/i18n/client";
import { usePricingMarket } from "@/components/providers/PricingMarketProvider";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { StarspinLogo } from "@/components/StarspinLogo";
import type { BillingPlan } from "@/lib/billing";
import { multiBusinessPriceForPlan } from "@/lib/billing-display";
import "@/components/marketing/cadeo-styles.css";

function isSetupIntentSecret(clientSecret: string) {
  return clientSecret.startsWith("seti_");
}

function MultiBusinessPaymentForm({ plan, clientSecret }: { plan: BillingPlan; clientSecret: string }) {
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
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch("/api/stripe/multi-business-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = (await res.json()) as { clientSecret?: string; error?: string };
      if (cancelled) return;

      if (!res.ok || !data.clientSecret) {
        setError(data.error ?? t("billing.checkoutError"));
        return;
      }

      setClientSecret(data.clientSecret);
    })();

    return () => {
      cancelled = true;
    };
  }, [plan, t]);

  return (
    <div className="cadeo-page cadeo-page--subscribe cadeo-page--checkout">
      <header className="cadeo-nav">
        <StarspinLogo href="/dashboard" variant="dark" size="sm" />
        <LocaleSwitcher variant="brutal" />
      </header>
      <main className="cadeo-checkout-main">
        <div className="cadeo-checkout-card">
          <h1 className="cadeo-checkout-title">{t("establishments.checkoutTitle")}</h1>
          <p className="cadeo-checkout-subtitle">{t("establishments.checkoutSubtitle")}</p>
          {error && <p className="cadeo-subscribe-btn-error">{error}</p>}
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <MultiBusinessPaymentForm plan={plan} clientSecret={clientSecret} />
            </Elements>
          )}
          {!clientSecret && !error && <p className="cadeo-checkout-loading">{t("billing.checkoutLoading")}</p>}
          <Link href="/dashboard/establishments" className="cadeo-checkout-back">
            {t("establishments.backToList")}
          </Link>
        </div>
      </main>
    </div>
  );
}
