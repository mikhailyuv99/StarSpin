"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

function isSmoothScrollPath(path: string): boolean {
  if (path === "/" || path.startsWith("/dashboard") || path.startsWith("/admin") || path.startsWith("/login") || path.startsWith("/setup")) {
    return false;
  }
  const seg = path.split("/").filter(Boolean);
  return seg.length === 1 && !["login", "setup", "admin"].includes(seg[0]);
}

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!isSmoothScrollPath(pathname)) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [pathname]);

  return <>{children}</>;
}
