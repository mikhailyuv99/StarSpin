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

export function StepIndicator({ current }: { current: PublicStep }) {
  const currentIndex = ORDER.indexOf(current);

  return (
    <div className="mb-8 flex justify-center gap-2">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step.key} className="flex flex-col items-center gap-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                done
                  ? "bg-green-500 text-white"
                  : active
                    ? "bg-white text-gray-900 ring-2 ring-white"
                    : "bg-white/30 text-white"
              }`}
            >
              {done ? "✓" : i + 1}
            </div>
            <span className="hidden text-[10px] text-white/80 sm:block">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
