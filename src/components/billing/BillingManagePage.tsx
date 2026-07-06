"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useI18n } from "@/i18n/client";
import type { BillingSummary } from "@/lib/billing-summary";
import { managePlanLabelForPlan, marketingPeriodForPlan } from "@/lib/billing-display";
import { ui } from "@/components/ui/styles";

function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
}

function formatMoney(cents: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function PaymentUpdateForm({ onUpdated }: { onUpdated: () => void }) {
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

    const { error: confirmError, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? t("billing.managePaymentError"));
      setSubmitting(false);
      return;
    }

    if (!setupIntent?.id) {
      setError(t("billing.managePaymentError"));
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/stripe/billing/confirm-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setupIntentId: setupIntent.id }),
    });

    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? t("billing.managePaymentError"));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onUpdated();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t-2 border-black/10 pt-4">
      <PaymentElement
        options={{
          layout: "tabs",
          paymentMethodOrder: ["apple_pay", "google_pay", "card"],
          wallets: { applePay: "auto", googlePay: "auto" },
        }}
      />
      {error && <p className={ui.alertError}>{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={!stripe || submitting} className={`${ui.btn} !w-auto px-5`}>
          {submitting ? t("billing.managePaymentSaving") : t("billing.managePaymentSave")}
        </button>
      </div>
      <p className="text-xs font-medium text-muted">{t("billing.checkoutFootnote")}</p>
    </form>
  );
}

export function BillingManagePage({
  merchantName,
  summary,
  publishableKey,
  isSubscribed,
}: {
  merchantName: string;
  summary: BillingSummary;
  publishableKey: string;
  isSubscribed: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);
  const [live, setLive] = useState(summary);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState<"cancel" | "resume" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = () => router.refresh();

  const planLabel = managePlanLabelForPlan(live.plan, t);

  const periodLabel =
    live.interval === "year"
      ? t("marketing.pricingPeriodAnnual")
      : live.interval === "quarter"
        ? t("marketing.pricingPeriodQuarterly")
        : live.interval === "month"
          ? t("marketing.pricingPeriodMonthly")
          : live.plan
            ? marketingPeriodForPlan(live.plan, t)
            : "";

  const priceLabel =
    live.amountCents && live.currency
      ? `${formatMoney(live.amountCents, live.currency, locale)}${periodLabel ? ` ${periodLabel}` : ""}`
      : planLabel;

  const statusLabel = (() => {
    if (live.cancelAtPeriodEnd) return t("billing.manageStatusCanceling");
    if (live.stripeStatus === "trialing") return t("billing.manageStatusTrial");
    if (live.stripeStatus === "active") return t("billing.manageStatusActive");
    if (live.stripeStatus === "past_due" || live.stripeStatus === "unpaid") {
      return t("billing.manageStatusPastDue");
    }
    return t("billing.manageStatusInactive");
  })();

  const renewalLabel = (() => {
    const dateIso = live.stripeStatus === "trialing" && live.trialEnd ? live.trialEnd : live.currentPeriodEnd;
    if (!dateIso) return null;
    const date = formatDate(dateIso, locale);
    if (live.cancelAtPeriodEnd) return t("billing.manageCancelsOn", { date });
    if (live.stripeStatus === "trialing") return t("billing.manageTrialEnds", { date });
    return t("billing.manageRenewsOn", { date });
  })();

  const paymentLabel =
    live.paymentMethodLast4 && live.paymentMethodBrand
      ? t("billing.manageCardOnFile", {
          brand: live.paymentMethodBrand,
          last4: live.paymentMethodLast4,
        })
      : t("billing.manageNoCard");

  const handleOpenPaymentForm = async () => {
    setShowPaymentForm(true);
    setPaymentSuccess(false);
    setSetupError(null);

    if (setupSecret) return;

    setSetupLoading(true);
    try {
      const res = await fetch("/api/stripe/billing/setup-payment", { method: "POST" });
      const data = (await res.json()) as { clientSecret?: string; error?: string };
      if (!res.ok || !data.clientSecret) {
        setSetupError(data.error ?? t("billing.managePaymentError"));
        return;
      }
      setSetupSecret(data.clientSecret);
    } catch {
      setSetupError(t("billing.managePaymentError"));
    } finally {
      setSetupLoading(false);
    }
  };

  const handlePaymentUpdated = () => {
    setPaymentSuccess(true);
    setShowPaymentForm(false);
    setSetupSecret(null);
    refresh();
  };

  const handleCancel = async () => {
    if (!window.confirm(t("billing.manageCancelConfirm"))) return;
    setActionLoading("cancel");
    setActionError(null);
    const res = await fetch("/api/stripe/billing/cancel", { method: "POST" });
    const data = (await res.json()) as { error?: string };
    setActionLoading(null);
    if (!res.ok) {
      setActionError(data.error ?? t("billing.manageCancelError"));
      return;
    }
    setLive((prev) => ({ ...prev, cancelAtPeriodEnd: true }));
    refresh();
  };

  const handleResume = async () => {
    setActionLoading("resume");
    setActionError(null);
    const res = await fetch("/api/stripe/billing/resume", { method: "POST" });
    const data = (await res.json()) as { error?: string };
    setActionLoading(null);
    if (!res.ok) {
      setActionError(data.error ?? t("billing.manageResumeError"));
      return;
    }
    setLive((prev) => ({ ...prev, cancelAtPeriodEnd: false }));
    refresh();
  };

  const canManageSubscription =
    live.stripeStatus === "active" || live.stripeStatus === "trialing" || live.stripeStatus === "past_due";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={ui.h1}>{t("billing.manageTitle")}</h1>
          <p className={ui.muted}>{t("billing.manageSubtitle")}</p>
          <p className="mt-2 text-sm font-extrabold text-ink">{merchantName}</p>
        </div>
        <Link href="/dashboard" className={`${ui.btnOutline} !w-auto px-5`}>
          {t("billing.backDashboard")}
        </Link>
      </div>

      <section className={`${ui.card} mx-auto max-w-2xl space-y-5`}>
        <h2 className={ui.h2}>{t("billing.managePlanTitle")}</h2>

        <div className="space-y-2 text-sm">
          <p>
            <span className="font-extrabold text-ink">{t("billing.managePlanLabel")}</span>{" "}
            <span className="text-muted">{priceLabel}</span>
          </p>
          <p>
            <span className="font-extrabold text-ink">{t("billing.manageStatusLabel")}</span>{" "}
            <span className="text-muted">{statusLabel}</span>
          </p>
          {renewalLabel && (
            <p>
              <span className="font-extrabold text-ink">{t("billing.manageRenewalLabel")}</span>{" "}
              <span className="text-muted">{renewalLabel}</span>
            </p>
          )}
          <p>
            <span className="font-extrabold text-ink">{t("billing.managePaymentLabel")}</span>{" "}
            <span className="text-muted">{paymentLabel}</span>
          </p>
        </div>

        {paymentSuccess && <p className={ui.alertSuccess}>{t("billing.managePaymentUpdated")}</p>}

        {live.hasAccount && !showPaymentForm && (
          <button
            type="button"
            onClick={handleOpenPaymentForm}
            className={`${ui.btnOutline} !w-auto px-5`}
          >
            {t("billing.managePaymentUpdate")}
          </button>
        )}

        {showPaymentForm && (
          <div className="space-y-3">
            {setupError && <p className={ui.alertError}>{setupError}</p>}
            {setupLoading && (
              <p className="text-sm font-medium text-muted">{t("billing.managePaymentLoading")}</p>
            )}
            {setupSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: setupSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "#9b7fe8",
                      colorBackground: "#ffffff",
                      colorText: "#0a0a0a",
                      borderRadius: "14px",
                    },
                  },
                }}
              >
                <PaymentUpdateForm onUpdated={handlePaymentUpdated} />
              </Elements>
            )}
          </div>
        )}

        {actionError && <p className={ui.alertError}>{actionError}</p>}

        {canManageSubscription && (
          <section className="space-y-3 rounded-[14px] border-2 border-red-300 bg-red-50/80 p-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-red-900">
              {t("billing.manageCancelSection")}
            </h3>
            <p className="text-sm font-medium text-red-900/80">{t("billing.manageCancelHelp")}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              {!live.cancelAtPeriodEnd ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={actionLoading !== null}
                  className={`${ui.btnDanger} !w-auto`}
                >
                  {actionLoading === "cancel" ? t("common.loading") : t("billing.manageCancel")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResume}
                  disabled={actionLoading !== null}
                  className={`${ui.btnSuccess} !w-auto`}
                >
                  {actionLoading === "resume" ? t("common.loading") : t("billing.manageResume")}
                </button>
              )}
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-3 border-t-2 border-black/10 pt-4">
          {!canManageSubscription && !isSubscribed && (
            <Link href="/subscribe" className={`${ui.btnYellow} !w-auto px-5 inline-flex`}>
              {t("dashboard.subscribeCta")}
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
