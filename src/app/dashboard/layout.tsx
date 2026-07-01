import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
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
    { href: "/dashboard", label: t("dashboard.navHome"), exact: true },
    { href: "/dashboard/branding", label: t("dashboard.navBranding") },
    { href: "/dashboard/prizes", label: t("dashboard.navPrizes") },
    { href: "/dashboard/reviews", label: t("dashboard.navReviews") },
    { href: "/dashboard/stats", label: t("dashboard.navStats") },
    { href: "/dashboard/qr", label: t("dashboard.navQr") },
  ];

  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-7 w-7 items-center justify-center rounded-sm bg-ink text-[10px] font-bold text-white"
            >
              RF
            </Link>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {t("common.dashboard")}
              </p>
              <p className="text-sm font-semibold leading-none text-ink">{merchant.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LocaleSwitcher variant="light" />
            <SignOutButton />
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-0 overflow-x-auto border-t border-border px-5 sm:px-8">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-[13px] font-medium text-muted transition-colors hover:border-zinc-300 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}
