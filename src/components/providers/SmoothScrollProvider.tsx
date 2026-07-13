"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { RESERVED_SLUGS } from "@/lib/app-url";

/** Marketing pages only — never on QR customer journeys (/{slug}, /play, /menu). */
function isSmoothScrollPath(path: string): boolean {
  if (
    path === "/" ||
    path.startsWith("/dashboard") ||
    path.startsWith("/admin") ||
    path.startsWith("/login") ||
    path.startsWith("/setup") ||
    path.startsWith("/subscribe") ||
    path.startsWith("/auth") ||
    path.startsWith("/api")
  ) {
    return false;
  }

  const seg = path.split("/").filter(Boolean);
  if (seg.length >= 1 && !RESERVED_SLUGS.has(seg[0])) {
    return false;
  }

  return seg.length === 1;
}

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<{ destroy: () => void; raf: (time: number) => void } | null>(null);

  useEffect(() => {
    if (!isSmoothScrollPath(pathname)) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let cancelled = false;
    let raf = 0;

    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      lenisRef.current = lenis;

      const loop = (time: number) => {
        lenis.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [pathname]);

  return <>{children}</>;
}
