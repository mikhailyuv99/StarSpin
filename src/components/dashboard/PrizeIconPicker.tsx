"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PrizeWheelIcon } from "@/components/PrizeWheelIcon";
import { useI18n } from "@/i18n/client";
import {
  PRIZE_ICON_ATTRIBUTION,
  PRIZE_ICON_GROUPS,
  formatPrizeIconLabel,
  normalizePrizeIcon,
  prizeIconGroupLabelKey,
  type PrizeIconId,
} from "@/lib/prize-icons";

const triggerBase =
  "brutal-btn brutal-btn-white cursor-pointer transition-[transform,box-shadow] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-45";

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

function IconPickerPanel({
  id,
  selected,
  onPick,
  onClose,
  className,
  style,
}: {
  id: string;
  selected: PrizeIconId;
  onPick: (id: PrizeIconId) => void;
  onClose: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { t } = useI18n();

  return (
    <div
      id={id}
      role="listbox"
      aria-label={t("dashboard.prizeIconChoose")}
      className={`z-50 flex max-h-[min(70vh,28rem)] flex-col overflow-hidden rounded-[16px] border-2 border-black bg-white shadow-[6px_6px_0_0_#0a0a0a] ${className ?? ""}`}
      style={style}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b-2 border-black bg-[var(--c-cream)] px-4 py-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-ink">
            {t("dashboard.prizeIconChoose")}
          </p>
          <p className="text-[11px] font-medium text-muted">{t("dashboard.prizeIconHint")}</p>
        </div>
        <button type="button" onClick={onClose} className={`${triggerBase} !px-2.5 !py-1 text-xs`}>
          {t("dashboard.prizeIconClose")}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <div className="space-y-4">
          {PRIZE_ICON_GROUPS.map((group) => (
            <section key={group.id} aria-label={t(prizeIconGroupLabelKey(group.id))}>
              <h4 className="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-wider text-muted">
                {t(prizeIconGroupLabelKey(group.id))}
              </h4>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {group.icons.map((iconId) => {
                  const active = selected === iconId;
                  return (
                    <button
                      key={iconId}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => onPick(iconId)}
                      title={formatPrizeIconLabel(iconId, t)}
                      className={`brutal-btn brutal-btn-white flex !h-auto !w-full !min-h-[4.75rem] flex-col items-center !gap-1.5 !overflow-visible !px-1.5 !py-2 !whitespace-normal ${
                        active ? "!bg-[var(--c-lavender)]" : ""
                      }`}
                    >
                      <PrizeWheelIcon icon={iconId} size={28} />
                      <span className="w-full text-center text-[10px] font-bold leading-snug text-ink whitespace-normal">
                        {formatPrizeIconLabel(iconId, t)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-4 border-t border-black/10 pt-3 text-center text-[10px] font-medium text-muted">
          <a
            href={PRIZE_ICON_ATTRIBUTION.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-2 hover:text-ink"
          >
            {PRIZE_ICON_ATTRIBUTION.text}
          </a>
        </p>
      </div>
    </div>
  );
}

export function PrizeIconPicker({
  value,
  onChange,
  variant = "field",
  disabled = false,
}: {
  value: string;
  onChange: (icon: PrizeIconId) => void;
  /** `compact` = icon chip in prize list; `field` = full row in forms */
  variant?: "field" | "compact";
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const selected = normalizePrizeIcon(value);
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
    const width =
      variant === "compact"
        ? Math.min(window.innerWidth - 32, 36 * 16)
        : Math.min(rect.width, window.innerWidth - 32);
    const maxHeight = Math.min(window.innerHeight * 0.7, 28 * 16);
    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;
    const openAbove = spaceBelow < 280 && spaceAbove > spaceBelow;

    let left = variant === "compact" ? rect.left : rect.left;
    left = Math.max(16, Math.min(left, window.innerWidth - width - 16));

    const top = openAbove ? rect.top - 8 : rect.bottom + 8;

    setPanelPos({ top, left, width, maxHeight, openAbove });
  }, [variant]);

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
    (id: PrizeIconId) => {
      onChange(id);
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
        zIndex: 60,
        transform: panelPos.openAbove ? "translateY(-100%)" : undefined,
      }
    : undefined;

  const panel =
    open && panelPos ? (
      <IconPickerPanel
        id={panelId}
        selected={selected}
        onPick={pick}
        onClose={close}
        style={panelStyle}
      />
    ) : null;

  if (variant === "compact") {
    return (
      <div ref={rootRef} className="relative shrink-0">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={panelId}
          aria-label={t("dashboard.prizeIconSelect", { label: formatPrizeIconLabel(selected, t) })}
          title={t("dashboard.prizeIconTapToChange")}
          className={`${triggerBase} group relative !h-12 !min-w-[3.25rem] !px-2 !py-1.5 ${
            open ? "!-translate-x-0.5 !-translate-y-0.5 !shadow-[6px_6px_0_0_#0a0a0a]" : ""
          }`}
        >
          <PrizeWheelIcon icon={selected} size={30} />
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-[8px] border-2 border-black bg-[var(--c-lavender)] text-ink shadow-[2px_2px_0_0_#0a0a0a] transition group-hover:-translate-y-px">
            <ChevronDown className={open ? "rotate-180" : ""} />
          </span>
        </button>

        {typeof document !== "undefined" && panel ? createPortal(panel, document.body) : null}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={panelId}
        className={`${triggerBase} w-full !justify-between !whitespace-normal !py-2.5 !pl-3 !pr-2.5 text-left ${
          open ? "!-translate-x-0.5 !-translate-y-0.5 !shadow-[6px_6px_0_0_#0a0a0a] ring-2 ring-[var(--c-lavender)]" : ""
        }`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border-2 border-black bg-[var(--c-cream)]">
            <PrizeWheelIcon icon={selected} size={34} />
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-muted">
              {t("dashboard.prizeIcon")}
            </span>
            <span className="block truncate text-sm font-extrabold text-ink">
              {formatPrizeIconLabel(selected, t)}
            </span>
            <span className="block text-xs font-medium text-muted">
              {t("dashboard.prizeIconTapToChange")}
            </span>
          </span>
        </span>
        <span
          className={`ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border-2 border-black bg-[var(--c-lavender)] text-ink transition ${
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
