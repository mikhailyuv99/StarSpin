"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "@/i18n/client";

const SCROLL_STEP = 140;

export function QRScrollRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const t = useTranslations();
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState, children]);

  const scrollBy = (delta: number) => {
    trackRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className={`qr-scroll-row ${className}`.trim()}>
      <div ref={trackRef} className="qr-scroll-row__track">
        {children}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          aria-label={t("common.scrollLeft")}
          onClick={() => scrollBy(-SCROLL_STEP)}
          className="qr-scroll-arrow qr-scroll-arrow--left lg:hidden"
        >
          ◀
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          aria-label={t("common.scrollRight")}
          onClick={() => scrollBy(SCROLL_STEP)}
          className="qr-scroll-arrow qr-scroll-arrow--right lg:hidden"
        >
          ▶
        </button>
      )}
    </div>
  );
}
