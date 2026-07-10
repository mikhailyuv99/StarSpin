"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BrutalMobileMenu, type MobileMenuItem } from "@/components/BrutalMobileMenu";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { StarspinLogo } from "@/components/StarspinLogo";
import { useTranslations } from "@/i18n/client";

type NavItem = { href: string; label: string };

function DashboardNavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    for (const item of items) {
      router.prefetch(item.href);
    }
  }, [items, router]);

  return (
    <nav className="brutal-nav-links" aria-label="Dashboard">
      {items.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            scroll={false}
            className={`brutal-nav-link${active ? " brutal-nav-link--active" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardHeader({
  nav,
  establishmentSwitcher,
}: {
  nav: NavItem[];
  establishmentSwitcher?: React.ReactNode;
}) {
  const t = useTranslations();
  const router = useRouter();

  const handleSignOut = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const menuItems: MobileMenuItem[] = [
    ...nav.map(
      (item): MobileMenuItem => ({
        type: "link",
        href: item.href,
        label: item.label,
      }),
    ),
    { type: "button", label: t("common.signOut"), onClick: handleSignOut, danger: true },
  ];

  return (
    <header className="brutal-nav">
      <StarspinLogo href="/dashboard" variant="light" size="md" wordmark="DASHBOARD" />
      <DashboardNavLinks items={nav} />
      <div className="flex shrink-0 items-center gap-2">
        {establishmentSwitcher}
        <LocaleSwitcher variant="brutal" />
        <BrutalMobileMenu items={menuItems} />
      </div>
    </header>
  );
}
