import Link from "next/link";
import { needsSubscription } from "@/lib/merchant-access";
import { getMerchantAccount, isAccountLive } from "@/lib/merchant-account";
import { Suspense } from "react";
import { getCurrentMerchant } from "@/lib/merchant";
import { redirect } from "next/navigation";
import { ui } from "@/components/ui/styles";
import { getTranslations } from "@/i18n/server";
import { DashboardBillingRedirect } from "@/components/billing/DashboardBillingRedirect";
import { DashboardHomeActive } from "@/components/dashboard/DashboardHomeActive";
import { SetupChecklist } from "@/components/dashboard/SetupChecklist";
import { computeSetupSteps, setupProgress } from "@/lib/merchant-setup";
import { publicMerchantUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect("/setup");
  const account = await getMerchantAccount();
  const t = await getTranslations();
  const supabase = await createClient();

  const { count: activePrizeCount } = await supabase
    .from("prizes")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", merchant.id)
    .eq("active", true);

  const setupSteps = computeSetupSteps(merchant, activePrizeCount ?? 0);
  const progress = setupProgress(setupSteps);

  const quickLinks = [
    { href: "/dashboard/flow", title: t("dashboard.flowCard"), desc: t("dashboard.flowCardDesc") },
    { href: "/dashboard/menu", title: t("dashboard.menuCard"), desc: t("dashboard.menuCardDesc") },
    { href: "/dashboard/prizes", title: t("dashboard.prizesCard"), desc: t("dashboard.prizesDesc") },
    { href: "/dashboard/qr", title: t("dashboard.qrCard"), desc: t("dashboard.qrDesc") },
    { href: "/dashboard/crm", title: t("dashboard.crmCard"), desc: t("dashboard.crmCardDesc") },
  ];

  const needsSubscribe = needsSubscription(account?.subscription_status ?? "cancelled");
  const isActive = isAccountLive(account);

  let totalSpins = 0;
  if (isActive) {
    const { count } = await supabase
      .from("spins")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", merchant.id);
    totalSpins = count ?? 0;
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <DashboardBillingRedirect />
      </Suspense>

      <div>
        <h1 className={ui.h1}>{t("dashboard.homeTitle")}</h1>
        <p className={ui.muted}>{t("dashboard.homeSubtitle")}</p>
      </div>

      <SetupChecklist
        steps={setupSteps}
        doneCount={progress.doneCount}
        total={progress.total}
        complete={progress.complete}
        labels={{
          title: t("dashboard.setupTitle"),
          subtitle: t("dashboard.setupSubtitle"),
          completeTitle: t("dashboard.setupCompleteTitle"),
          completeBody: t("dashboard.setupCompleteBody"),
          stepSubscribe: t("dashboard.setupStepSubscribe"),
          stepJourney: t("dashboard.setupStepJourney"),
          stepPrizes: t("dashboard.setupStepPrizes"),
          stepQr: t("dashboard.setupStepQr"),
          stepTest: t("dashboard.setupStepTest"),
          progress: t("dashboard.setupProgress"),
          open: t("dashboard.setupOpen"),
          done: t("dashboard.setupDone"),
        }}
      />

      {needsSubscribe && (
        <div className={`${ui.card} border-[var(--c-yellow)] bg-[var(--c-yellow-bright)]/40`}>
          <h2 className="text-base font-extrabold text-ink">{t("dashboard.subscribeTitle")}</h2>
          <p className="mt-2 text-sm text-muted">{t("dashboard.subscribeBody")}</p>
          <div className="mt-4">
            <Link href="/subscribe" className={`${ui.btnYellow} !w-auto px-6 py-3 inline-flex`}>
              {t("dashboard.subscribeCta")}
            </Link>
          </div>
          <p className="mt-3 text-xs font-semibold text-muted">{t("dashboard.subscribeHint")}</p>
        </div>
      )}

      {isActive ? (
        <DashboardHomeActive
          slug={merchant.slug}
          publicUrl={publicMerchantUrl(merchant.slug)}
          totalSpins={totalSpins}
          showBilling={Boolean(account?.stripe_customer_id)}
          quickLinks={quickLinks.map(({ href, title }) => ({ href, title }))}
          labels={{
            title: t("dashboard.homeLiveTitle"),
            body: t("dashboard.homeLiveBody"),
            testJourney: t("dashboard.testJourney"),
            copyLink: t("dashboard.copyPublicLink"),
            copiedLink: t("dashboard.copiedPublicLink"),
            totalSpins: t("dashboard.homeTotalSpins"),
            quickNav: t("dashboard.homeQuickNav"),
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${ui.cardGrid}${item.href === "/dashboard/crm" ? " sm:col-span-2" : ""}`}
            >
              <h2 className="text-[15px] font-extrabold text-ink">{item.title}</h2>
              <p className="mt-1 text-sm font-medium text-muted">{item.desc}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
