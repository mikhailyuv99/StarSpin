"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardHeader } from "@/components/DashboardHeader";

type NavItem = { href: string; label: string };

export function DashboardShell({
  nav,
  children,
}: {
  nav: NavItem[];
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
    <div className={`brutal-page ${qrStudio ? "brutal-page--qr-studio" : "pb-10"}`}>
      <div className="brutal-nav-wrap">
        <DashboardHeader nav={nav} />
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <main>{children}</main>
      </div>
    </div>
  );
}
