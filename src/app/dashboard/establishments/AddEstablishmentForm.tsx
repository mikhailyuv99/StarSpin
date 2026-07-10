"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ui } from "@/components/ui/styles";
import { useTranslations } from "@/i18n/client";

export function AddEstablishmentForm({ disabled }: { disabled?: boolean }) {
  const t = useTranslations();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (disabled) return;

    setLoading(true);
    setError(null);

    const res = await fetch("/api/merchants/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    const data = (await res.json()) as { error?: string; code?: string };
    if (!res.ok) {
      if (data.code === "multi_business_required") {
        setError(t("establishments.multiBusinessRequired"));
      } else {
        setError(data.error ?? t("common.genericError"));
      }
      setLoading(false);
      return;
    }

    router.refresh();
    router.push("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit} className={`${ui.card} space-y-4`}>
      <h2 className="text-base font-extrabold text-ink">{t("establishments.addTitle")}</h2>
      <p className="text-sm text-muted">{t("establishments.addSubtitle")}</p>
      {error && <p className={ui.alertError}>{error}</p>}
      <div>
        <label className={ui.label}>{t("setup.businessName")}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={ui.input}
          placeholder={t("establishments.addNamePlaceholder")}
          disabled={disabled || loading}
          required
        />
      </div>
      <button type="submit" disabled={disabled || loading || !name.trim()} className={ui.btnYellow}>
        {loading ? t("setup.creating") : t("establishments.addCta")}
      </button>
    </form>
  );
}
