"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isBillingPlan } from "@/lib/billing";
import { useI18n } from "@/i18n/client";
import { ui } from "@/components/ui/styles";

/** Legacy ?subscribe= redirect + post-checkout activation polling. */
export function DashboardBillingRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  useEffect(() => {
    const plan = searchParams.get("subscribe");
    if (plan && isBillingPlan(plan)) {
      router.replace(`/subscribe/checkout?plan=${plan}`);
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (searchParams.get("billing") !== "success") return;

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      const res = await fetch("/api/stripe/billing/status");
      const data = (await res.json()) as { live?: boolean };
      if (cancelled) return;

      if (data.live) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      attempts += 1;
      if (attempts < 24) {
        window.setTimeout(poll, 1500);
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (searchParams.get("billing") !== "success") return null;

  return (
    <div className={`${ui.card} border-[var(--c-mint)] bg-[var(--c-mint)]/20`}>
      <p className="text-sm font-bold text-ink">{t("billing.activatingTitle")}</p>
      <p className="mt-1 text-sm text-muted">{t("billing.activatingBody")}</p>
    </div>
  );
}
