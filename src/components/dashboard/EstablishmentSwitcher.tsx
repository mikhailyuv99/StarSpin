"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "@/i18n/client";

type EstablishmentOption = { id: string; name: string };

export function EstablishmentSwitcher({
  establishments,
  activeMerchantId,
}: {
  establishments: EstablishmentOption[];
  activeMerchantId: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  if (establishments.length <= 1) return null;

  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const merchantId = event.target.value;
    if (merchantId === activeMerchantId) return;

    setSwitching(true);
    const res = await fetch("/api/merchants/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantId }),
    });

    if (res.ok) {
      router.refresh();
    }
    setSwitching(false);
  };

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">{t("establishments.switcherLabel")}</span>
      <select
        value={activeMerchantId}
        onChange={handleChange}
        disabled={switching}
        className="max-w-[10rem] truncate rounded-lg border-2 border-black bg-white px-2 py-1.5 text-xs font-bold text-ink sm:max-w-[12rem]"
        aria-label={t("establishments.switcherLabel")}
      >
        {establishments.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
    </label>
  );
}
