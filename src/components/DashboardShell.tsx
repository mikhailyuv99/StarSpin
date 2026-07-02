import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { SignOutButton } from "@/components/SignOutButton";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { StarspinLogo } from "@/components/StarspinLogo";

type NavItem = { href: string; label: string };

export function DashboardShell({
  nav,
  children,
}: {
  nav: NavItem[];
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
        <main>{children}</main>
      </div>
    </div>
  );
}
