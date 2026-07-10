"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ActiveMerchantProvider } from "@/components/dashboard/ActiveMerchantContext";
import { DashboardHeader } from "@/components/DashboardHeader";
import { EstablishmentSwitcher } from "@/components/dashboard/EstablishmentSwitcher";

type NavItem = { href: string; label: string };
type EstablishmentOption = { id: string; name: string };

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

  useEffect(() => {
    if (!qrStudio) return;
    document.documentElement.classList.add("qr-studio-active");
    document.body.classList.add("qr-studio-active");
    return () => {
      document.documentElement.classList.remove("qr-studio-active");
      document.body.classList.remove("qr-studio-active");
    };
  }, [qrStudio]);

  return (
    <ActiveMerchantProvider initialMerchantId={activeMerchantId}>
      <div className={`brutal-page ${qrStudio ? "brutal-page--qr-studio" : "pb-10"}`}>
        <div className="brutal-nav-wrap">
          <DashboardHeader
            nav={nav}
            establishmentSwitcher={<EstablishmentSwitcher establishments={establishments} />}
          />
        </div>

        <div className="mx-auto min-w-0 max-w-5xl overflow-x-clip px-4 pt-6 sm:px-6">
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </ActiveMerchantProvider>
  );
}
