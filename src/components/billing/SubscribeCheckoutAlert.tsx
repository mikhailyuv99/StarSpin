"use client";

import { useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/client";

export function SubscribeCheckoutAlert() {
  const searchParams = useSearchParams();
  const { t } = useI18n();

  if (searchParams.get("checkout") !== "error") return null;

  return (
    <div className="cadeo-subscribe-alert" role="alert">
      {t("billing.checkoutError")}
    </div>
  );
}
