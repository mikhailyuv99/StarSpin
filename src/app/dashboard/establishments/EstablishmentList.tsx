"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Merchant } from "@/lib/types";
import { ui } from "@/components/ui/styles";
import { useTranslations } from "@/i18n/client";

export function EstablishmentList({
  establishments,
  activeMerchantId,
  accountLive,
}: {
  establishments: Merchant[];
  activeMerchantId: string;
  accountLive: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const handleSwitch = async (merchantId: string) => {
    if (merchantId === activeMerchantId) return;
    setSwitchingId(merchantId);

    const res = await fetch("/api/merchants/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantId }),
    });

    if (res.ok) {
      router.refresh();
      router.push("/dashboard");
    }

    setSwitchingId(null);
  };

  return (
    <div className="space-y-3">
      {establishments.map((establishment) => {
        const isActive = establishment.id === activeMerchantId;
        const isLive = accountLive;

        return (
          <div
            key={establishment.id}
            className={`${ui.card} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
              isActive ? "ring-2 ring-[var(--c-yellow)]" : ""
            }`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-extrabold text-ink">{establishment.name}</h3>
                {isActive && (
                  <span className="rounded-full border-2 border-black bg-[var(--c-yellow)] px-2 py-0.5 text-[10px] font-extrabold uppercase">
                    {t("establishments.activeBadge")}
                  </span>
                )}
                <span
                  className={`rounded-full border-2 border-black px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                    isLive ? "bg-green-200" : "bg-gray-200"
                  }`}
                >
                  {isLive ? t("establishments.statusLive") : t("establishments.statusInactive")}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">/{establishment.slug}</p>
            </div>
            <button
              type="button"
              onClick={() => handleSwitch(establishment.id)}
              disabled={isActive || switchingId === establishment.id}
              className={`${ui.btnOutline} !w-auto shrink-0 px-4 py-2`}
            >
              {isActive
                ? t("establishments.current")
                : switchingId === establishment.id
                  ? t("establishments.switching")
                  : t("establishments.switch")}
            </button>
          </div>
        );
      })}
    </div>
  );
}
