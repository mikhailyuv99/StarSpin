"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "@/i18n/client";
import type { BillingPlan } from "@/lib/billing";

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

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (res.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent("/#pricing")}&plan=${plan}`);
        return;
      }

      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      console.error(data.error ?? "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={handleClick} disabled={loading} className={className}>
      {loading ? t("common.loading") : children}
    </button>
  );
}
