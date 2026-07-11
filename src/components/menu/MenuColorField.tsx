"use client";

import { useEffect, useId, useRef, useState } from "react";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = Number.parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

function hsvToRgb(h: number, s: number, v: number) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: (r + m) * 255,
    g: (g + m) * 255,
    b: (b + m) * 255,
  };
}

function normalizeHex(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed.toUpperCase()}`;
  return fallback.toUpperCase();
}

const PRESETS = [
  "#FFF8F1",
  "#FFFFFF",
  "#F5F0E8",
  "#1A1A1A",
  "#E85D04",
  "#F5E08E",
  "#0D9488",
  "#2563EB",
  "#BE123C",
  "#7C3AED",
];

export function MenuColorField({
  label,
  value,
  fallback = "#FFF8F1",
  onChange,
}: {
  label: string;
  value: string;
  fallback?: string;
  onChange: (value: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const color = normalizeHex(value || fallback, fallback);
  const [h, setH] = useState(() => rgbToHsv(hexToRgb(color).r, hexToRgb(color).g, hexToRgb(color).b).h);
  const [s, setS] = useState(() => rgbToHsv(hexToRgb(color).r, hexToRgb(color).g, hexToRgb(color).b).s);
  const [v, setV] = useState(() => rgbToHsv(hexToRgb(color).r, hexToRgb(color).g, hexToRgb(color).b).v);
  const [hexDraft, setHexDraft] = useState(color);

  useEffect(() => {
    const next = rgbToHsv(hexToRgb(color).r, hexToRgb(color).g, hexToRgb(color).b);
    setH(next.h);
    setS(next.s);
    setV(next.v);
    setHexDraft(color);
  }, [color]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const applyHsv = (nh: number, ns: number, nv: number) => {
    setH(nh);
    setS(ns);
    setV(nv);
    const rgb = hsvToRgb(nh, ns, nv);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setHexDraft(hex);
    onChange(hex);
  };

  const hueRgb = hsvToRgb(h, 1, 1);
  const hueColor = rgbToHex(hueRgb.r, hueRgb.g, hueRgb.b);

  return (
    <div ref={rootRef} className="relative">
      <span className="mb-1.5 block text-xs font-semibold text-zinc-700">{label}</span>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-2xl border border-black/10 bg-white p-2.5 text-left transition hover:bg-[var(--c-cream)]"
      >
        <span
          className="h-11 w-11 shrink-0 rounded-xl border border-black/10"
          style={{ backgroundColor: color }}
        />
        <span className="font-mono text-sm uppercase">{color}</span>
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 space-y-3 rounded-2xl border border-black/10 bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
        >
          <div
            className="relative h-40 w-full cursor-crosshair touch-none overflow-hidden rounded-xl"
            style={{
              backgroundColor: hueColor,
              backgroundImage:
                "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
            }}
            onPointerDown={(e) => {
              const el = e.currentTarget;
              el.setPointerCapture(e.pointerId);
              const move = (ev: PointerEvent) => {
                const rect = el.getBoundingClientRect();
                const ns = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
                const nv = clamp(1 - (ev.clientY - rect.top) / rect.height, 0, 1);
                applyHsv(h, ns, nv);
              };
              move(e.nativeEvent);
              const up = () => {
                el.releasePointerCapture(e.pointerId);
                el.removeEventListener("pointermove", move);
                el.removeEventListener("pointerup", up);
              };
              el.addEventListener("pointermove", move);
              el.addEventListener("pointerup", up);
            }}
          >
            <span
              className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
              style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%`, backgroundColor: color }}
            />
          </div>

          <input
            type="range"
            min={0}
            max={360}
            value={Math.round(h)}
            aria-label="Hue"
            className="menu-hue-slider h-3 w-full cursor-pointer appearance-none rounded-full"
            style={{
              background:
                "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
            }}
            onChange={(e) => applyHsv(Number(e.target.value), s, v)}
          />

          <input
            type="text"
            value={hexDraft}
            onChange={(e) => {
              const next = e.target.value.toUpperCase();
              setHexDraft(next);
              if (/^#[0-9A-F]{6}$/.test(next)) onChange(next);
            }}
            className="w-full rounded-xl border border-black/10 bg-[var(--c-cream)] px-3 py-2 font-mono text-sm uppercase outline-none focus:border-black/25"
            spellCheck={false}
          />

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-label={preset}
                onClick={() => onChange(preset)}
                className={`h-8 w-8 rounded-xl border transition active:scale-95 ${
                  color === preset ? "border-black ring-2 ring-black/15" : "border-black/10"
                }`}
                style={{ backgroundColor: preset }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
