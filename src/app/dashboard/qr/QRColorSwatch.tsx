"use client";

import { useId, useRef } from "react";
import { normalizeHex } from "@/lib/qr-design";
import { ui } from "@/components/ui/styles";

export function QRColorSwatch({
  label,
  value,
  fallback = "#ffffff",
  onChange,
}: {
  label: string;
  value: string;
  fallback?: string;
  onChange: (value: string) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const color = normalizeHex(value, fallback);

  return (
    <div>
      <label htmlFor={inputId} className={ui.label}>
        {label}
      </label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-1.5 block h-9 w-9 cursor-pointer rounded-[10px] border-2 border-black shadow-[2px_2px_0_0_#0a0a0a] transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: color }}
        aria-label={label}
      />
      <input
        ref={inputRef}
        id={inputId}
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
}
