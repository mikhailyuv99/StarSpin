"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "@/i18n/client";
import { ColorPickButton } from "@/components/dashboard/ColorPickButton";
import { JourneyPhonePreview } from "@/components/dashboard/JourneyPhonePreview";
import { PublicFlow } from "@/components/PublicFlow";
import {
  JOURNEY_TEMPLATE_IDS,
  JOURNEY_TEMPLATES,
  allJourneyFontHrefs,
  resolveJourneyTheme,
  type JourneyTemplateId,
} from "@/lib/journey-theme";
import type { Merchant, Prize } from "@/lib/types";

/** Loads every template's Google fonts once so the previews render true-to-life. */
function useJourneyPreviewFonts() {
  useEffect(() => {
    for (const href of allJourneyFontHrefs()) {
      if (document.querySelector(`link[data-pj-font="${href}"]`)) continue;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.dataset.pjFont = href;
      document.head.appendChild(link);
    }
  }, []);
}

/** Small swatch card in the horizontal template rail. */
function ThemeCard({
  id,
  selected,
  onSelect,
  label,
}: {
  id: JourneyTemplateId;
  selected: boolean;
  onSelect: () => void;
  label: string;
}) {
  const def = JOURNEY_TEMPLATES[id];
  const v = def.vars;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`journey-theme-card ${selected ? "journey-theme-card--active" : ""}`}
    >
      <span className="journey-theme-preview" style={{ background: v["--pj-bg"] }}>
        <span
          className="journey-theme-mini"
          style={{
            background: v["--pj-card-bg"],
            border: v["--pj-card-border"],
            borderRadius: `min(${v["--pj-card-radius"]}, 12px)`,
            backdropFilter: v["--pj-card-backdrop"],
            WebkitBackdropFilter: v["--pj-card-backdrop"],
          }}
        >
          <span
            className="journey-theme-mini-title"
            style={{
              fontFamily: v["--pj-font-display"],
              color: v["--pj-ink"],
              textTransform: v["--pj-heading-transform"] as React.CSSProperties["textTransform"],
            }}
          >
            Aa
          </span>
          <span className="journey-theme-dots">
            {def.wheel.palette.slice(0, 4).map((c, i) => (
              <span key={i} style={{ background: c }} />
            ))}
          </span>
          <span
            className="journey-theme-pill"
            style={{ background: def.accent, borderRadius: `min(${v["--pj-btn-radius"]}, 999px)` }}
          />
        </span>
      </span>
      <span className="journey-theme-name">{label}</span>
      {selected && (
        <span className="journey-theme-check" aria-hidden>
          ✓
        </span>
      )}
    </button>
  );
}

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

function JourneyThemeRail({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const wrapRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [arrowCenterY, setArrowCenterY] = useState<number | null>(null);

  const updateScrollState = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  const updateArrowPosition = useCallback(() => {
    const wrap = wrapRef.current;
    const card = railRef.current?.querySelector<HTMLElement>(".journey-theme-card");
    if (!wrap || !card) return;
    const wrapRect = wrap.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    setArrowCenterY(cardRect.top - wrapRect.top + cardRect.height / 2);
  }, []);

  const refreshRail = useCallback(() => {
    updateScrollState();
    updateArrowPosition();
  }, [updateScrollState, updateArrowPosition]);

  useEffect(() => {
    refreshRail();
    const wrap = wrapRef.current;
    const rail = railRef.current;
    if (!wrap || !rail) return;

    const ro = new ResizeObserver(refreshRail);
    ro.observe(wrap);
    ro.observe(rail);
    window.addEventListener("resize", refreshRail);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", refreshRail);
    };
  }, [refreshRail]);

  const scrollBy = (direction: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".journey-theme-card");
    const step = (card?.offsetWidth ?? 116) + 10;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const arrowStyle =
    arrowCenterY != null ? ({ top: arrowCenterY, transform: "translateY(-50%)" } as const) : undefined;

  return (
    <div ref={wrapRef} className="journey-theme-rail-wrap">
      {canScrollLeft && (
        <button
          type="button"
          className="journey-theme-rail-arrow journey-theme-rail-arrow--left"
          style={arrowStyle}
          aria-label={t("dashboard.journeyThemeScrollLeft")}
          onClick={() => scrollBy(-1)}
        >
          <RailChevron direction="left" />
        </button>
      )}
      <div
        ref={railRef}
        className={`journey-theme-rail${canScrollLeft ? " journey-theme-rail--pad-left" : ""}${canScrollRight ? " journey-theme-rail--pad-right" : ""}`}
        onScroll={refreshRail}
      >
        {children}
      </div>
      {canScrollRight && (
        <button
          type="button"
          className="journey-theme-rail-arrow journey-theme-rail-arrow--right"
          style={arrowStyle}
          aria-label={t("dashboard.journeyThemeScrollRight")}
          onClick={() => scrollBy(1)}
        >
          <RailChevron direction="right" />
        </button>
      )}
    </div>
  );
}

export function JourneyThemePicker({
  template,
  accent,
  onTemplateChange,
  onAccentChange,
  previewMerchant,
  previewPrizes,
  actions,
}: {
  template: JourneyTemplateId;
  accent: string;
  onTemplateChange: (id: JourneyTemplateId) => void;
  onAccentChange: (hex: string) => void;
  previewMerchant: Merchant;
  previewPrizes: Prize[];
  actions?: React.ReactNode;
}) {
  const t = useTranslations();
  useJourneyPreviewFonts();
  const flowKey = (previewMerchant.flow_steps ?? []).join(",");

  // The merchant rendered in the phone always reflects the current template + accent.
  const themedMerchant = useMemo<Merchant>(
    () => ({
      ...previewMerchant,
      subscription_status: "active",
      journey_theme: { v: 1, template, accent: accent.trim() || null },
    }),
    [previewMerchant, template, accent],
  );

  const resolvedAccent = useMemo(
    () => resolveJourneyTheme(themedMerchant).accent,
    [themedMerchant],
  );

  return (
    <div className="journey-picker">
      <section className="journey-picker-stage" aria-label={t("dashboard.journeyThemePick")}>
        <JourneyPhonePreview
          remountKey={`${template}-${accent}-${flowKey}-${previewMerchant.name}-${previewMerchant.logo_url ?? ""}`}
        >
          <PublicFlow
            key={`${template}-${accent}-${flowKey}-${previewMerchant.name}-${previewMerchant.logo_url ?? ""}`}
            merchant={themedMerchant}
            prizes={previewPrizes}
            preview
          />
        </JourneyPhonePreview>
        <div className="journey-picker-actions">
          <p className="journey-preview-hint">{t("dashboard.journeyThemeStepHint")}</p>
        </div>
      </section>

      <section className="journey-picker-controls">
        <div className="journey-picker-block">
          <p className="section-label text-muted">{t("dashboard.journeyThemePick")}</p>
          <JourneyThemeRail>
            {JOURNEY_TEMPLATE_IDS.map((id) => (
              <ThemeCard
                key={id}
                id={id}
                selected={template === id}
                onSelect={() => onTemplateChange(id)}
                label={t(`dashboard.journeyTheme_${id}`)}
              />
            ))}
          </JourneyThemeRail>
        </div>

        <div className="journey-accent journey-picker-block">
          <div>
            <p className="text-sm font-extrabold text-ink">{t("dashboard.journeyThemeAccent")}</p>
            <p className="mt-0.5 text-xs font-medium text-muted">
              {t("dashboard.journeyThemeAccentHint")}
            </p>
          </div>
          <div className="mt-3 flex items-stretch gap-2">
            <div className="flex-1 min-w-0">
              <ColorPickButton
                label={accent ? accent.toUpperCase() : t("dashboard.journeyThemeAccentAuto")}
                value={accent || resolvedAccent}
                onChange={onAccentChange}
              />
            </div>
            {accent && (
              <button
                type="button"
                onClick={() => onAccentChange("")}
                className="brutal-btn brutal-btn-white shrink-0 text-xs"
              >
                {t("dashboard.journeyThemeAccentReset")}
              </button>
            )}
          </div>
        </div>
        {actions ? <div className="journey-picker-block">{actions}</div> : null}
      </section>
    </div>
  );
}
