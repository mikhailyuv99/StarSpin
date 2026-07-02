"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ui } from "@/components/ui/styles";
import { useTranslations } from "@/i18n/client";

export function SpinCooldownForm({
  merchantId,
  initialDays,
}: {
  merchantId: string;
  initialDays: number;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [days, setDays] = useState(String(initialDays));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(days, 10);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 365) {
      setMessage(t("dashboard.spinCooldownInvalid"));
      return;
    }

    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("merchants")
      .update({ spin_cooldown_days: parsed })
      .eq("id", merchantId);

    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(t("common.saved"));
    router.refresh();
  };

  const parsedDays = parseInt(days, 10);

  return (
    <form onSubmit={handleSubmit} className={`${ui.card} max-w-xl space-y-4`}>
      <div>
        <h2 className={ui.h2}>{t("dashboard.spinCooldownTitle")}</h2>
        <p className={`mt-2 ${ui.muted}`}>{t("dashboard.spinCooldownDesc")}</p>
      </div>

      <div>
        <label className={ui.label} htmlFor="spin-cooldown-days">
          {t("dashboard.spinCooldownDays")}
        </label>
        <input
          id="spin-cooldown-days"
          type="number"
          min={0}
          max={365}
          step={1}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className={ui.input}
        />
        <p className="mt-2 text-xs font-medium text-muted">
          {parsedDays === 0 ? t("dashboard.spinCooldownDisabled") : t("dashboard.spinCooldownHint", { days: parsedDays })}
        </p>
      </div>

      {message && <p className={ui.alertSuccess}>{message}</p>}

      <button type="submit" disabled={loading} className={ui.btn}>
        {loading ? t("common.saving") : t("common.save")}
      </button>
    </form>
  );
}
