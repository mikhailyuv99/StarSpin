"use client";

import { contrastTextColor } from "@/lib/wheel";

export function ColorPickButton({
 label,
 value,
 onChange,
}: {
 label: string;
 value: string;
 onChange: (value: string) => void;
}) {
 const textColor = contrastTextColor(value);

 return (
 <label
 className="brutal-color-pick relative flex min-h-[3.25rem] w-full cursor-pointer items-center justify-center overflow-hidden rounded-[14px] border-2 border-black transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 "
 style={{ backgroundColor: value, color: textColor }}
 >
 <span className="pointer-events-none text-sm font-extrabold uppercase tracking-wide">{label}</span>
 <input
 type="color"
 value={value}
 onChange={(e) => onChange(e.target.value)}
 className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
 aria-label={label}
 />
 </label>
 );
}
