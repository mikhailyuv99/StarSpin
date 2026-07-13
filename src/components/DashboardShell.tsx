"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  ActiveMerchantProvider,
  useActiveMerchant,
} from "@/components/dashboard/ActiveMerchantContext";
import { DashboardContentSkeleton } from "@/components/dashboard/DashboardContentSkeleton";
import { DashboardHeader } from "@/components/DashboardHeader";
import { EstablishmentSwitcher } from "@/components/dashboard/EstablishmentSwitcher";

type NavItem = { href: string; label: string };
type EstablishmentOption = { id: string; name: string };

function DashboardMain({
  children,
  fullHeight = false,
}: {
  children: React.ReactNode;
  fullHeight?: boolean;
}) {
  const { isRefreshingMerchant } = useActiveMerchant();

  return (
    <div className={`mx-auto min-w-0 max-w-5xl overflow-x-clip px-4 pt-6 sm:px-6 ${fullHeight ? "flex min-h-0 w-full max-w-none flex-1 flex-col !px-0 !pt-0" : ""}`}>
      <main className={`min-w-0 ${fullHeight ? "flex min-h-0 flex-1 flex-col" : ""}`}>
        {isRefreshingMerchant ? <DashboardContentSkeleton /> : children}
      </main>
    </div>
  );
}

export function DashboardShell({
  nav,
  establishments,
  activeMerchantId,
  children,
}: {
  nav: NavItem[];
  establishments: EstablishmentOption[];
  activeMerchantId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const qrStudio = pathname === "/dashboard/qr";
  const menuStudio = pathname === "/dashboard/menu";
  const fullBleedStudio = qrStudio || menuStudio;

  useEffect(() => {
    if (!fullBleedStudio) return;
    const cls = menuStudio ? "menu-studio-active" : "qr-studio-active";
    document.documentElement.classList.add(cls);
    document.body.classList.add(cls);
    return () => {
      document.documentElement.classList.remove("qr-studio-active", "menu-studio-active");
      document.body.classList.remove("qr-studio-active", "menu-studio-active");
    };
  }, [fullBleedStudio, menuStudio]);

  return (
    <ActiveMerchantProvider initialMerchantId={activeMerchantId}>
      <div
        className={`brutal-page ${fullBleedStudio ? "brutal-page--qr-studio" : "pb-10"} ${
          menuStudio ? "flex min-h-0 flex-col" : ""
        }`}
      >
        <div className="brutal-nav-wrap">
          <DashboardHeader
            nav={nav}
            establishmentSwitcher={<EstablishmentSwitcher establishments={establishments} />}
          />
        </div>

        <DashboardMain fullHeight={menuStudio}>{children}</DashboardMain>
      </div>
    </ActiveMerchantProvider>
  );
}
