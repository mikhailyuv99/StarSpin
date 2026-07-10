"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BrutalMobileMenu, type MobileMenuItem } from "@/components/BrutalMobileMenu";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { StarspinLogo } from "@/components/StarspinLogo";
import { useTranslations } from "@/i18n/client";

type NavItem = { href: string; label: string };

export function DashboardHeader({
  nav,
  establishmentSwitcher,
}: {
  nav: NavItem[];
  establishmentSwitcher?: React.ReactNode;
}) {
  const t = useTranslations();
  const router = useRouter();

  useEffect(() => {
    for (const item of nav) {
      router.prefetch(item.href);
    }
  }, [nav, router]);

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
    <header className="brutal-nav brutal-nav--dashboard">
      <div className="brutal-nav-brand">
        <StarspinLogo href="/dashboard" variant="light" size="sm" wordmark="DASHBOARD" />
      </div>
      <div className="brutal-nav-controls">
        <div className="brutal-nav-controls-start">{establishmentSwitcher}</div>
        <div className="brutal-nav-controls-end">
          <LocaleSwitcher variant="brutal" compact />
          <BrutalMobileMenu items={menuItems} />
        </div>
      </div>
    </header>
  );
}
