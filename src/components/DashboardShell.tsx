import Link from "next/link";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { SignOutButton } from "@/components/SignOutButton";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { StarspinLogo } from "@/components/StarspinLogo";

type NavItem = { href: string; label: string };

export function DashboardShell({
  merchantName,
  nav,
  labels,
  children,
}: {
  merchantName: string;
  nav: NavItem[];
  labels: {
    dashboard: string;
    viewSite: string;
  };
  children: React.ReactNode;
}) {
  return (
    <div className="brutal-page pb-10">
      <div className="brutal-nav-wrap">
        <header className="brutal-nav">
          <StarspinLogo href="/dashboard" variant="light" size="md" wordmark="DASHBOARD" />
          <DashboardNav items={nav} />
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
              {labels.dashboard}
            </p>
            <p className="text-base font-extrabold text-ink">{merchantName}</p>
          </div>
          <Link href="/dashboard" className="brutal-btn brutal-btn-yellow text-sm">
            {labels.viewSite}
          </Link>
        </div>
        <main>{children}</main>
      </div>
    </div>
  );
}
