"use client";

import { useEffect, useId, useRef, useState } from "react";
import { QR_FONT_CATEGORIES, QR_FONTS, getQRFont } from "@/lib/qr-fonts";
import { ui } from "@/components/ui/styles";
import { useTranslations } from "@/i18n/client";

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
  const [open, setOpen] = useState(false);

  const selected = getQRFont(value);

  const grouped = QR_FONT_CATEGORIES.map((cat) => ({
    ...cat,
    fonts: QR_FONTS.filter((f) => f.category === cat.id),
  }));

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
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={`${id}-label`}
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 max-h-64 overflow-y-auto rounded-[14px] border-2 border-black bg-white shadow-[4px_4px_0_0_#0a0a0a]"
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
                          setOpen(false);
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
      )}
    </div>
  );
}
