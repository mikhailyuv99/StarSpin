"use client";

import type { Merchant } from "@/lib/types";
import { useTranslations } from "@/i18n/client";

export function MerchantHeader({ merchant }: { merchant: Merchant }) {
  const t = useTranslations();
  return (
    <header className="mb-5 text-center sm:mb-6">
      {merchant.logo_url && (
        <img
          src={merchant.logo_url}
          alt={merchant.name}
          className="mx-auto mb-3 h-16 w-16 rounded-[14px] border-[2.5px] border-black object-cover sm:h-[4.5rem] sm:w-[4.5rem]"
        />
      )}
      <h1 className="font-[family-name:var(--font-display)] text-balance text-xl font-extrabold uppercase leading-tight text-ink sm:text-2xl">
        {merchant.name}
      </h1>
      <p className="mt-1.5 text-sm font-semibold text-muted sm:mt-2">{t("public.headerSubtitle")}</p>
    </header>
  );
}
