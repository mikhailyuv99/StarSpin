"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "@/i18n/client";

const SCROLL_STEP = 160;

export function QRScrollRow({
  children,
  className = "",
  mobileOnly = true,
}: {
  children: ReactNode;
  className?: string;
  mobileOnly?: boolean;
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

  const arrowClass = mobileOnly ? "qr-scroll-arrow lg:hidden" : "qr-scroll-arrow";

  return (
    <div className={`qr-scroll-row ${className}`.trim()}>
      <button
        type="button"
        aria-label={t("common.scrollLeft")}
        disabled={!canScrollLeft}
        onClick={() => scrollBy(-SCROLL_STEP)}
        className={`${arrowClass} qr-scroll-arrow--left`}
      >
        ◀
      </button>

      <div ref={trackRef} className="qr-scroll-row__track">
        {children}
      </div>

      <button
        type="button"
        aria-label={t("common.scrollRight")}
        disabled={!canScrollRight}
        onClick={() => scrollBy(SCROLL_STEP)}
        className={`${arrowClass} qr-scroll-arrow--right`}
      >
        ▶
      </button>
    </div>
  );
}
