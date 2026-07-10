"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "@/i18n/client";

function RailChevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 8 12" fill="none" aria-hidden>
      <path
        d={direction === "left" ? "M6.5 1L1.5 6l5 5" : "M1.5 1l5 5-5 5"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function JourneyPreviewRail({
  children,
  ariaLabel,
}: {
  children: React.ReactNode;
  ariaLabel: string;
}) {
  const t = useTranslations();
  const wrapRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const wrap = wrapRef.current;
    const rail = railRef.current;
    if (!wrap || !rail) return;

    const ro = new ResizeObserver(updateScrollState);
    ro.observe(wrap);
    ro.observe(rail);
    window.addEventListener("resize", updateScrollState);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, children]);

  const scrollBy = (direction: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".journey-preview-step");
    const step = (card?.offsetWidth ?? 140) + 20;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return (
    <div ref={wrapRef} className="journey-preview-rail-wrap">
      {canScrollLeft && (
        <button
          type="button"
          className="journey-preview-rail-arrow journey-preview-rail-arrow--left"
          aria-label={t("dashboard.journeyThemeScrollLeft")}
          onClick={() => scrollBy(-1)}
        >
          <RailChevron direction="left" />
        </button>
      )}
      <div
        ref={railRef}
        className={`journey-preview${canScrollLeft ? " journey-preview--pad-left" : ""}${canScrollRight ? " journey-preview--pad-right" : ""}`}
        aria-label={ariaLabel}
        onScroll={updateScrollState}
      >
        {children}
      </div>
      {canScrollRight && (
        <button
          type="button"
          className="journey-preview-rail-arrow journey-preview-rail-arrow--right"
          aria-label={t("dashboard.journeyThemeScrollRight")}
          onClick={() => scrollBy(1)}
        >
          <RailChevron direction="right" />
        </button>
      )}
    </div>
  );
}
