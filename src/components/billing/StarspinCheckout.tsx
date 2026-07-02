"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useI18n } from "@/i18n/client";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { StarspinLogo } from "@/components/StarspinLogo";
import { MobileAppBanner } from "@/components/marketing/MobileAppBanner";
import type { BillingPlan } from "@/lib/billing";
import "@/components/marketing/cadeo-styles.css";

function CheckoutPaymentForm({ plan }: { plan: BillingPlan }) {
  const { t } = useI18n();
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
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (confirmError) {
      setError(confirmError.message ?? t("billing.checkoutError"));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="cadeo-checkout-form">
      <PaymentElement
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
        {submitting
          ? t("billing.checkoutProcessing")
          : plan === "monthly"
            ? t("billing.checkoutPayMonthly")
            : t("billing.checkoutPayAnnual")}
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
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch("/api/stripe/subscription-setup", {
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

  const amountLabel =
    plan === "monthly" ? t("marketing.pricingPriceMonthly") : t("marketing.pricingPriceAnnual");
  const periodLabel =
    plan === "monthly" ? t("marketing.pricingPeriodMonthly") : t("marketing.pricingPeriodAnnual");

  return (
    <div className="cadeo-page cadeo-page--subscribe cadeo-page--checkout">
      <MobileAppBanner />
      <div className="cadeo-nav-wrap">
        <nav className="cadeo-nav">
          <StarspinLogo href="/dashboard" variant="light" size="md" />
          <div className="cadeo-nav-actions cadeo-subscribe-nav-actions">
            <Link href="/subscribe" className="cadeo-btn cadeo-btn-outline">
              {t("billing.checkoutBack")}
            </Link>
            <LocaleSwitcher variant="brutal" />
          </div>
        </nav>
      </div>

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
            <p className="cadeo-checkout-price">
              {amountLabel}
              <span className="cadeo-checkout-period"> {periodLabel}</span>
            </p>
            <p className="cadeo-pricing-wallets">{t("marketing.pricingWallets")}</p>
          </div>

          {error && <p className="cadeo-subscribe-btn-error">{error}</p>}

          {!clientSecret && !error && (
            <p className="cadeo-checkout-loading">{t("billing.checkoutPreparing")}</p>
          )}

          {clientSecret && (
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
              }}
            >
              <CheckoutPaymentForm plan={plan} />
            </Elements>
          )}
        </div>
      </main>
    </div>
  );
}
