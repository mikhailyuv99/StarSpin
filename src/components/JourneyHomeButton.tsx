"use client";

import { OFFICIAL_SITE_URL } from "@/lib/brand";
import { useTranslations } from "@/i18n/client";

export function JourneyHomeButton({
  className = "",
}: {
  className?: string;
}) {
  const t = useTranslations();

  return (
    <a
      href={OFFICIAL_SITE_URL}
      className={`journey-home-btn ${className}`.trim()}
      aria-label={t("common.backHome")}
      title={t("common.backHome")}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V21h13V9.5" />
      </svg>
    </a>
  );
}
