"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PRIZE_RARITY_TIERS, type PrizeRarityTier } from "@/lib/prize-rarity";
import { useTranslations } from "@/i18n/client";

export const TIER_DOT: Record<PrizeRarityTier, string> = {
  common: "#22c55e",
  uncommon: "#3b82f6",
  rare: "#a855f7",
  epic: "#ef4444",
  jackpot: "#eab308",
};

const triggerBase =
  "brutal-btn brutal-btn-white w-full cursor-pointer transition-[transform,box-shadow] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-45";

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width={12}
      height={12}
      className={className}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 4.5 6 8 9.5 4.5" />
    </svg>
  );
}

function RarityPanel({
  id,
  value,
  onPick,
  onClose,
  style,
}: {
  id: string;
  value: PrizeRarityTier;
  onPick: (tier: PrizeRarityTier) => void;
  onClose: () => void;
  style?: React.CSSProperties;
}) {
  const t = useTranslations();

  return (
    <div
      id={id}
      role="listbox"
      aria-label={t("dashboard.prizeRarity")}
      className="z-[60] flex max-h-[min(70vh,20rem)] flex-col overflow-hidden rounded-[16px] border-2 border-black bg-white shadow-[6px_6px_0_0_#0a0a0a]"
      style={style}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b-2 border-black bg-[var(--c-cream)] px-4 py-3">
        <p className="text-xs font-extrabold uppercase tracking-wider text-ink">
          {t("dashboard.prizeRarityChoose")}
        </p>
        <button type="button" onClick={onClose} className={`${triggerBase} !w-auto !px-2.5 !py-1 text-xs`}>
          {t("dashboard.prizeIconClose")}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
        {PRIZE_RARITY_TIERS.map((tier) => {
          const active = value === tier;
          return (
            <button
              key={tier}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => onPick(tier)}
              className={`mb-1 flex w-full items-center gap-3 rounded-[12px] border-2 px-3 py-2.5 text-left transition last:mb-0 ${
                active
                  ? "border-black bg-[var(--c-lavender)] shadow-[3px_3px_0_0_#0a0a0a]"
                  : "border-transparent bg-white hover:border-black/20 hover:bg-[var(--c-cream)]"
              }`}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black"
                style={{ backgroundColor: TIER_DOT[tier] }}
                aria-hidden
              />
              <span className="text-sm font-extrabold text-ink">{t(`dashboard.prizeRarity_${tier}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PrizeRaritySelect({
  value,
  onChange,
  disabled,
}: {
  value: PrizeRarityTier;
  onChange: (tier: PrizeRarityTier) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [panelPos, setPanelPos] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    openAbove: boolean;
  } | null>(null);

  const close = useCallback(() => setOpen(false), []);

  const updatePanelPosition = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 240), window.innerWidth - 32);
    const maxHeight = Math.min(window.innerHeight * 0.7, 20 * 16);
    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;
    const openAbove = spaceBelow < 220 && spaceAbove > spaceBelow;

    const left = Math.max(16, Math.min(rect.left, window.innerWidth - width - 16));
    const top = openAbove ? rect.top - 8 : rect.bottom + 8;

    setPanelPos({ top, left, width, maxHeight, openAbove });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPanelPos(null);
      return;
    }
    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  const pick = useCallback(
    (tier: PrizeRarityTier) => {
      onChange(tier);
      setOpen(false);
    },
    [onChange],
  );

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const root = rootRef.current;
      const panelEl = document.getElementById(panelId);
      if (root?.contains(target) || panelEl?.contains(target)) return;
      close();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open, close, panelId]);

  const panelStyle: React.CSSProperties | undefined = panelPos
    ? {
        position: "fixed",
        top: panelPos.top,
        left: panelPos.left,
        width: panelPos.width,
        maxHeight: panelPos.maxHeight,
        transform: panelPos.openAbove ? "translateY(-100%)" : undefined,
      }
    : undefined;

  const panel =
    open && panelPos ? (
      <RarityPanel id={panelId} value={value} onPick={pick} onClose={close} style={panelStyle} />
    ) : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={panelId}
        className={`${triggerBase} !justify-between !py-2.5 !pl-3 !pr-2.5 text-left ${
          open ? "!-translate-x-0.5 !-translate-y-0.5 !shadow-[6px_6px_0_0_#0a0a0a] ring-2 ring-[var(--c-lavender)]" : ""
        }`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          <span
            className="h-6 w-6 shrink-0 rounded-full border-2 border-black"
            style={{ backgroundColor: TIER_DOT[value] }}
            aria-hidden
          />
          <span className="truncate text-sm font-extrabold text-ink">
            {t(`dashboard.prizeRarity_${value}`)}
          </span>
        </span>
        <span
          className={`ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border-2 border-black bg-[var(--c-lavender)] text-ink transition ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          <ChevronDown />
        </span>
      </button>

      {typeof document !== "undefined" && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}

export function PrizeRarityBadge({ tier }: { tier: PrizeRarityTier }) {
  const t = useTranslations();
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full border border-black/20"
        style={{ backgroundColor: TIER_DOT[tier] }}
        aria-hidden
      />
      {t(`dashboard.prizeRarity_${tier}`)}
    </span>
  );
}
