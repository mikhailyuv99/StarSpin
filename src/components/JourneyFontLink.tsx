"use client";

import { useEffect, useRef } from "react";

/** Load journey theme fonts without blocking first paint. */
export function JourneyFontLink({ href }: { href: string }) {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.media = "print";
    link.onload = () => {
      link.media = "all";
    };
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [href]);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    </>
  );
}
