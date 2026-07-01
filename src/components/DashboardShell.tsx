import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { StarspinLogo } from "@/components/StarspinLogo";
import { getTranslations } from "@/i18n/server";

type NavItem = { href: string; label: string };

export async function DashboardShell({
  merchantName,
  nav,
  children,
}: {
  merchantName: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const t = await getTranslations();

  return (
    <div className="brutal-page pb-10">
      <div className="brutal-nav-wrap">
        <header className="brutal-nav">
          <StarspinLogo href="/" variant="light" size="md" />
          <nav className="brutal-nav-links" aria-label="Dashboard">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="brutal-nav-link">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <LocaleSwitcher variant="brutal" />
            <SignOutButton />
          </div>
        </header>
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <div className="brutal-card mb-8 flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
              {t("common.dashboard")}
            </p>
            <p className="text-base font-extrabold text-ink">{merchantName}</p>
          </div>
          <Link href="/" className="brutal-btn brutal-btn-yellow text-sm">
            {t("login.back")}
          </Link>
        </div>
        <main>{children}</main>
      </div>
    </div>
  );
}
