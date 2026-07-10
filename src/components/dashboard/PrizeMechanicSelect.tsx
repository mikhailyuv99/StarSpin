"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PrizeWheelIcon } from "@/components/PrizeWheelIcon";
import { useI18n } from "@/i18n/client";
import {
 defaultIconForMechanic,
 normalizePrizeMechanic,
 PRIZE_MECHANICS,
 type PrizeMechanic,
} from "@/lib/prize-mechanics";

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

function mechanicLabelKey(mechanic: PrizeMechanic): string {
 return `dashboard.prizeMechanic_${mechanic}`;
}

function MechanicPanel({
 id,
 value,
 onPick,
 onClose,
 style,
}: {
 id: string;
 value: PrizeMechanic;
 onPick: (mechanic: PrizeMechanic) => void;
 onClose: () => void;
 style?: React.CSSProperties;
}) {
 const { t } = useI18n();

 return (
 <div
 id={id}
 role="listbox"
 aria-label={t("dashboard.prizeMechanic")}
 className="z-[60] flex max-h-[min(70vh,24rem)] flex-col overflow-hidden rounded-[16px] border-2 border-black bg-white "
 style={style}
 >
 <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b-2 border-black bg-[var(--c-cream)] px-4 py-3">
 <p className="text-xs font-extrabold uppercase tracking-wider text-ink">
 {t("dashboard.prizeMechanicChoose")}
 </p>
 <button type="button" onClick={onClose} className={`${triggerBase} !w-auto !px-2.5 !py-1 text-xs`}>
 {t("dashboard.prizeIconClose")}
 </button>
 </div>
 <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
 {PRIZE_MECHANICS.map((mechanic) => {
 const active = value === mechanic;
 return (
 <button
 key={mechanic}
 type="button"
 role="option"
 aria-selected={active}
 onClick={() => onPick(mechanic)}
 className={`mb-1 flex w-full items-start gap-3 rounded-[12px] border-2 px-3 py-2.5 text-left transition last:mb-0 ${
 active
 ? "border-black bg-[var(--c-lavender)] "
 : "border-transparent bg-white hover:border-black/20 hover:bg-[var(--c-cream)]"
 }`}
 >
 <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border-2 border-black bg-white">
 <PrizeWheelIcon icon={defaultIconForMechanic(mechanic)} size={26} plain />
 </span>
 <span className="min-w-0 pt-0.5">
 <span className="block text-sm font-extrabold text-ink">
 {t(mechanicLabelKey(mechanic))}
 </span>
 <span className="mt-0.5 block text-xs font-medium leading-snug text-muted">
 {t(`dashboard.prizeMechanicHint_${mechanic}`)}
 </span>
 </span>
 </button>
 );
 })}
 </div>
 </div>
 );
}

export function PrizeMechanicSelect({
 value,
 onChange,
 disabled = false,
}: {
 value: PrizeMechanic;
 onChange: (mechanic: PrizeMechanic) => void;
 disabled?: boolean;
}) {
 const { t } = useI18n();
 const selected = normalizePrizeMechanic(value);
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
 const width = Math.min(Math.max(rect.width, 280), window.innerWidth - 32);
 const maxHeight = Math.min(window.innerHeight * 0.7, 24 * 16);
 const spaceBelow = window.innerHeight - rect.bottom - 16;
 const spaceAbove = rect.top - 16;
 const openAbove = spaceBelow < 260 && spaceAbove > spaceBelow;

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
 (mechanic: PrizeMechanic) => {
 onChange(mechanic);
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
 <MechanicPanel
 id={panelId}
 value={selected}
 onPick={pick}
 onClose={close}
 style={panelStyle}
 />
 ) : null;

 return (
 <div ref={rootRef} className="relative mt-2 max-w-md">
 <button
 type="button"
 disabled={disabled}
 onClick={() => setOpen((v) => !v)}
 aria-expanded={open}
 aria-haspopup="listbox"
 aria-controls={panelId}
 className={`${triggerBase} !justify-between !whitespace-normal !py-2.5 !pl-3 !pr-2.5 text-left ${
 open ? "!-translate-x-0.5 !-translate-y-0.5 ring-2 ring-[var(--c-lavender)]" : ""
 }`}
 >
 <span className="flex min-w-0 flex-1 items-center gap-3">
 <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border-2 border-black bg-[var(--c-cream)]">
 <PrizeWheelIcon icon={defaultIconForMechanic(selected)} size={26} plain />
 </span>
 <span className="min-w-0">
 <span className="block truncate text-sm font-extrabold text-ink">
 {t(mechanicLabelKey(selected))}
 </span>
 <span className="block truncate text-xs font-medium text-muted">
 {t(`dashboard.prizeMechanicHint_${selected}`)}
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
