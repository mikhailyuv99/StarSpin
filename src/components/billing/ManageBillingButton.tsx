import Link from "next/link";
import { useTranslations } from "@/i18n/client";

export function ManageBillingButton({ className = "" }: { className?: string }) {
  const t = useTranslations();

  return (
    <Link href="/dashboard/billing" prefetch className={className}>
      {t("dashboard.manageBilling")}
    </Link>
  );
}
