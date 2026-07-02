import { DashboardShell } from "@/components/DashboardShell";
import { getCurrentMerchant } from "@/lib/merchant";
import { getTranslations } from "@/i18n/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect("/setup");
  const t = await getTranslations();

  const NAV = [
    { href: "/dashboard", label: t("common.dashboard") },
    { href: "/dashboard/flow", label: t("dashboard.navFlow") },
    { href: "/dashboard/prizes", label: t("dashboard.navPrizes") },
    { href: "/dashboard/reviews", label: t("dashboard.navReviews") },
    { href: "/dashboard/crm", label: t("dashboard.navCrm") },
    { href: "/dashboard/qr", label: t("dashboard.navQr") },
  ];

  return (
    <DashboardShell nav={NAV}>
      {children}
    </DashboardShell>
  );
}
