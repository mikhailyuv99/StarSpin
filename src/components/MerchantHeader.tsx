"use client";

import type { Merchant } from "@/lib/types";
import { useTranslations } from "@/i18n/client";

export function MerchantHeader({ merchant }: { merchant: Merchant }) {
  const t = useTranslations();
  return (
    <header className="mb-5 text-center sm:mb-8">
      {merchant.logo_url && (
        <img
          src={merchant.logo_url}
          alt={merchant.name}
          className="mx-auto mb-3 h-14 w-14 rounded-sm border-2 border-white/40 object-cover sm:mb-4 sm:h-16 sm:w-16"
        />
      )}
      <h1 className="text-balance text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl">
        {merchant.name}
      </h1>
      <p className="mt-1.5 text-sm text-white/85 sm:mt-2">{t("public.headerSubtitle")}</p>
    </header>
  );
}
