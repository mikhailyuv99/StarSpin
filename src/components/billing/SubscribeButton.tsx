"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "@/i18n/client";
import type { BillingPlan } from "@/lib/billing";
import { startCheckoutSession } from "@/lib/billing-checkout";

export function SubscribeButton({
  plan,
  className = "",
  children,
}: {
  plan: BillingPlan;
  className?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    const result = await startCheckoutSession(plan);

    if (result.ok) {
      window.location.assign(result.url);
      return;
    }

    if (result.status === 401) {
      router.push(`/login?redirect=${encodeURIComponent("/subscribe")}&plan=${plan}`);
      return;
    }

    setError(t("billing.checkoutError"));
    setLoading(false);
  };

  return (
    <div className="cadeo-subscribe-btn-wrap">
      <button type="button" onClick={handleClick} disabled={loading} className={className}>
        {loading ? t("billing.checkoutLoading") : children}
      </button>
      {error && <p className="cadeo-subscribe-btn-error">{error}</p>}
    </div>
  );
}
