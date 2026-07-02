"use client";

import { useState } from "react";
import { useTranslations } from "@/i18n/client";

export function ManageBillingButton({ className = "" }: { className?: string }) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={handleClick} disabled={loading} className={className}>
      {loading ? t("common.loading") : t("dashboard.manageBilling")}
    </button>
  );
}
