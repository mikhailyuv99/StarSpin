import Link from "next/link";
import { isMerchantLive, needsSubscription } from "@/lib/merchant-access";
import { Suspense } from "react";
import { getCurrentMerchant } from "@/lib/merchant";
import { redirect } from "next/navigation";
import { ui } from "@/components/ui/styles";
import { getTranslations } from "@/i18n/server";
import { ManageBillingButton } from "@/components/billing/ManageBillingButton";
import { DashboardBillingRedirect } from "@/components/billing/DashboardBillingRedirect";

export default async function DashboardPage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect("/setup");
  const t = await getTranslations();

  const links = [
    { href: "/dashboard/flow", title: t("dashboard.flowCard"), desc: t("dashboard.flowCardDesc") },
    { href: "/dashboard/prizes", title: t("dashboard.prizesCard"), desc: t("dashboard.prizesDesc") },
    { href: "/dashboard/crm", title: t("dashboard.crmCard"), desc: t("dashboard.crmCardDesc") },
    { href: "/dashboard/qr", title: t("dashboard.qrCard"), desc: t("dashboard.qrDesc") },
  ];

  const needsSubscribe = needsSubscription(merchant.subscription_status);
  const isActive = isMerchantLive(merchant.subscription_status);

  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <DashboardBillingRedirect />
      </Suspense>

      <div>
        <h1 className={ui.h1}>{t("dashboard.homeTitle")}</h1>
        <p className={ui.muted}>{t("dashboard.homeSubtitle")}</p>
      </div>

      {needsSubscribe && (
        <div className={`${ui.card} border-[var(--c-yellow)] bg-[var(--c-yellow-bright)]/40`}>
          <h2 className="text-base font-extrabold text-ink">{t("dashboard.subscribeTitle")}</h2>
          <p className="mt-2 text-sm text-muted">{t("dashboard.subscribeBody")}</p>
          <div className="mt-4">
            <Link href="/subscribe" className={`${ui.btnYellow} !w-auto px-6 py-3 inline-flex`}>
              {t("dashboard.subscribeCta")}
            </Link>
          </div>
          <p className="mt-3 text-xs font-semibold text-muted">{t("marketing.pricingWallets")}</p>
        </div>
      )}

      {isActive && merchant.stripe_customer_id && (
        <div className="flex justify-end">
          <ManageBillingButton className={`${ui.btnOutline} !w-auto px-5`} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className={ui.cardGrid}>
            <h2 className="text-[15px] font-extrabold text-ink">{item.title}</h2>
            <p className="mt-1 text-sm text-muted">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
