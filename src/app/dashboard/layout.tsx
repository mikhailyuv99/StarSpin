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
    { href: "/", label: t("dashboard.navMarketing") },
    { href: "/dashboard", label: t("dashboard.navHome") },
    { href: "/dashboard/flow", label: t("dashboard.navSetup") },
    { href: "/dashboard/prizes", label: t("dashboard.navPrizes") },
    { href: "/dashboard/qr", label: t("dashboard.navQr") },
    { href: "/dashboard/crm", label: t("dashboard.navCustomers") },
    { href: "/dashboard/billing", label: t("dashboard.navBilling") },
  ];

  return (
    <DashboardShell nav={NAV}>
      {children}
    </DashboardShell>
  );
}
