import Link from "next/link";
import { getCurrentMerchant } from "@/lib/merchant";
import { redirect } from "next/navigation";
import { ui } from "@/components/ui/styles";
import { getTranslations } from "@/i18n/server";

export default async function DashboardPage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect("/setup");
  const t = await getTranslations();

  const links = [
    { href: "/dashboard/branding", title: t("dashboard.brandingCard"), desc: t("dashboard.brandingDesc") },
    { href: "/dashboard/prizes", title: t("dashboard.prizesCard"), desc: t("dashboard.prizesDesc") },
    { href: "/dashboard/qr", title: t("dashboard.qrCard"), desc: t("dashboard.qrDesc") },
    { href: "/dashboard/stats", title: t("dashboard.statsCard"), desc: t("dashboard.statsDesc") },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className={ui.h1}>{t("dashboard.homeTitle")}</h1>
        <p className={ui.muted}>{t("dashboard.homeSubtitle")}</p>
      </div>

      <div className={ui.card}>
        <p className={ui.statLabel}>{t("dashboard.publicPage")}</p>
        <Link href={`/${merchant.slug}`} className={`mt-2 inline-block font-mono text-sm ${ui.link}`}>
          /{merchant.slug}
        </Link>
        <p className="mt-4 text-sm text-muted">
          {t("common.subscription")} ·{" "}
          <span className="font-mono text-xs uppercase text-ink">{merchant.subscription_status}</span>
        </p>
      </div>

      <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="bg-white p-6 hover:bg-surface">
            <h2 className="text-[15px] font-semibold text-ink">{item.title}</h2>
            <p className="mt-1 text-sm text-muted">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
