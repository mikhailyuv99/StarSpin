"use client";

import type { PublicStep } from "@/lib/types";

const STEPS: { key: PublicStep; label: string }[] = [
  { key: "phone", label: "Téléphone" },
  { key: "social", label: "Réseaux" },
  { key: "review", label: "Avis" },
  { key: "wheel", label: "Roue" },
  { key: "result", label: "Prix" },
];

const ORDER: PublicStep[] = ["phone", "social", "review", "wheel", "result"];

export function StepIndicator({
  current,
  accent,
}: {
  current: PublicStep;
  accent: string;
}) {
  const currentIndex = ORDER.indexOf(current);

  return (
    <div className="mb-8 flex justify-center gap-1">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step.key} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="flex h-7 w-full max-w-[2.5rem] items-center justify-center rounded-sm text-[10px] font-bold uppercase tracking-wide"
              style={{
                backgroundColor: done || active ? accent : "rgba(255,255,255,0.15)",
                color: done || active ? "#fff" : "rgba(255,255,255,0.7)",
                border: active ? "2px solid #fff" : "1px solid rgba(255,255,255,0.25)",
              }}
            >
              {done ? "✓" : i + 1}
            </div>
            <span className="hidden text-[10px] font-medium uppercase tracking-wide text-white/80 sm:block">
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
