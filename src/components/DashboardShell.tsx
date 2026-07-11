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

function DashboardMain({ children }: { children: React.ReactNode }) {
  const { isRefreshingMerchant } = useActiveMerchant();

  return (
    <div className="mx-auto min-w-0 max-w-5xl overflow-x-clip px-4 pt-6 sm:px-6">
      <main className="min-w-0">
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
    const cls = qrStudio ? "qr-studio-active" : "menu-studio-active";
    document.documentElement.classList.add(cls);
    document.body.classList.add(cls);
    if (menuStudio) {
      document.documentElement.classList.add("qr-studio-active");
      document.body.classList.add("qr-studio-active");
    }
    return () => {
      document.documentElement.classList.remove("qr-studio-active", "menu-studio-active");
      document.body.classList.remove("qr-studio-active", "menu-studio-active");
    };
  }, [fullBleedStudio, qrStudio, menuStudio]);

  return (
    <ActiveMerchantProvider initialMerchantId={activeMerchantId}>
      <div className={`brutal-page ${fullBleedStudio ? "brutal-page--qr-studio" : "pb-10"}`}>
        <div className="brutal-nav-wrap">
          <DashboardHeader
            nav={nav}
            establishmentSwitcher={<EstablishmentSwitcher establishments={establishments} />}
          />
        </div>

        <DashboardMain>{children}</DashboardMain>
      </div>
    </ActiveMerchantProvider>
  );
}
