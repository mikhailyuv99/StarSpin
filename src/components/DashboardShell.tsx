import { DashboardHeader } from "@/components/DashboardHeader";

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
        <DashboardHeader nav={nav} />
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <main>{children}</main>
      </div>
    </div>
  );
}
