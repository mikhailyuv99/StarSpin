"use client";

import { useEffect } from "react";

/** Mobile QR studio: drop forced viewport height on shell ancestors. */
export function QrStudioPageShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const page = document.querySelector(".brutal-page");
    page?.classList.add("brutal-page--qr-studio");
    document.documentElement.classList.add("qr-studio-active");
    document.body.classList.add("qr-studio-active");

    return () => {
      page?.classList.remove("brutal-page--qr-studio");
      document.documentElement.classList.remove("qr-studio-active");
      document.body.classList.remove("qr-studio-active");
    };
  }, []);

  return children;
}
