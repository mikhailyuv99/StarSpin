"use client";

import { useId } from "react";
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
 const color = normalizeHex(value, fallback);

 return (
 <div>
 <label htmlFor={inputId} className={ui.label}>
 {label}
 </label>
 <div
 className="relative mt-1.5 h-9 w-9 rounded-[10px] border-2 border-black transition-transform active:scale-95"
 style={{ backgroundColor: color }}
 >
 <input
 id={inputId}
 type="color"
 value={color}
 onChange={(e) => onChange(e.target.value)}
 aria-label={label}
 className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
 />
 </div>
 </div>
 );
}
