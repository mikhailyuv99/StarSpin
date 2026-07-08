"use client";

import type { Merchant } from "@/lib/types";
import { useTranslations } from "@/i18n/client";

export function MerchantHeader({
  merchant,
  forceMobileLayout = false,
}: {
  merchant: Merchant;
  /** Dashboard phone preview: use mobile breakpoints only (<640px). */
  forceMobileLayout?: boolean;
}) {
  const t = useTranslations();
  const headline = merchant.customer_page_headline?.trim() || merchant.name;
  const subtitle = merchant.customer_page_subtitle?.trim() || t("public.headerSubtitle");

  return (
    <header className={`mb-5 text-center${forceMobileLayout ? "" : " sm:mb-6"}`}>
      {merchant.logo_url && (
        <img
          src={merchant.logo_url}
          alt={merchant.name}
          className={`mx-auto mb-3 h-16 w-16 object-cover${forceMobileLayout ? "" : " sm:h-[4.5rem] sm:w-[4.5rem]"}`}
          style={{
            borderRadius: "var(--pj-logo-radius, 14px)",
            border: "var(--pj-logo-border, 2.5px solid #0a0a0a)",
          }}
        />
      )}
      <h1
        className={`public-heading text-balance text-xl font-extrabold leading-tight${forceMobileLayout ? "" : " sm:text-2xl"}`}
      >
        {headline}
      </h1>
      <p className={`mt-1.5 text-sm font-semibold text-muted${forceMobileLayout ? "" : " sm:mt-2"}`}>{subtitle}</p>
    </header>
  );
}
