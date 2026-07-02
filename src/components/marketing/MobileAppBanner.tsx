"use client";

import { useI18n } from "@/i18n/client";

export function MobileAppBanner({ variant = "marketing" }: { variant?: "marketing" | "brutal" }) {
  const { t } = useI18n();

  return (
    <div
      className={variant === "marketing" ? "cadeo-app-banner" : "site-app-banner site-app-banner--brutal"}
      role="status"
    >
      <span className="site-app-banner-icon" aria-hidden>
        📱
      </span>
      <span>{t("marketing.mobileAppBanner")}</span>
    </div>
  );
}
