"use client";

import { useEffect, useId, useRef, useState } from "react";
import { QR_FONT_CATEGORIES, QR_FONTS, getQRFont } from "@/lib/qr-fonts";
import { ui } from "@/components/ui/styles";
import { useTranslations } from "@/i18n/client";

const SCROLL_STEP = 120;

export function QRFontPicker({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (fontId: string) => void;
}) {
  const t = useTranslations();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const selected = getQRFont(value);

  const grouped = QR_FONT_CATEGORIES.map((cat) => ({
    ...cat,
    fonts: QR_FONTS.filter((f) => f.category === cat.id),
  }));

  const updateScrollState = () => {
    const el = listRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 0);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  };

  const scrollList = (delta: number) => {
    listRef.current?.scrollBy({ top: delta, behavior: "smooth" });
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <span className={ui.label} id={`${id}-label`}>
        {label}
      </span>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label`}
        aria-controls={listboxId}
        onClick={() => setOpen((prev) => !prev)}
        className={`${ui.input} mt-0 flex w-full items-center justify-between gap-2 text-left font-medium`}
        style={{ fontFamily: selected.googleFamily }}
      >
        <span className="truncate">{selected.label}</span>
        <span className="shrink-0 text-xs font-extrabold text-muted" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 overflow-hidden rounded-[14px] border-2 border-black bg-white shadow-[4px_4px_0_0_#0a0a0a]">
          <button
            type="button"
            aria-label={t("common.scrollUp")}
            disabled={!canScrollUp}
            onClick={() => scrollList(-SCROLL_STEP)}
            className="flex w-full items-center justify-center border-b-2 border-black/10 py-1.5 text-xs font-extrabold text-muted transition-colors hover:bg-[var(--c-lavender)] disabled:cursor-default disabled:opacity-30"
          >
            ▲
          </button>

          <div
            id={listboxId}
            ref={listRef}
            role="listbox"
            aria-labelledby={`${id}-label`}
            className="qr-font-list max-h-64 overflow-y-auto"
          >
            {grouped.map((group) => (
              <div key={group.id}>
                <p className="sticky top-0 border-b-2 border-black/10 bg-[var(--c-cream)] px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-muted">
                  {t(group.labelKey)}
                </p>
                <ul className="py-1">
                  {group.fonts.map((font) => {
                    const isSelected = font.id === value;
                    return (
                      <li key={font.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            onChange(font.id);
                          }}
                          className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--c-lavender)] ${
                            isSelected ? "bg-[var(--c-yellow)] font-extrabold" : "font-semibold"
                          }`}
                          style={{ fontFamily: font.googleFamily }}
                        >
                          <span>{font.label}</span>
                          {isSelected && (
                            <span className="text-[10px] font-extrabold uppercase text-muted">✓</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <button
            type="button"
            aria-label={t("common.scrollDown")}
            disabled={!canScrollDown}
            onClick={() => scrollList(SCROLL_STEP)}
            className="flex w-full items-center justify-center border-t-2 border-black/10 py-1.5 text-xs font-extrabold text-muted transition-colors hover:bg-[var(--c-lavender)] disabled:cursor-default disabled:opacity-30"
          >
            ▼
          </button>
        </div>
      )}
    </div>
  );
}
