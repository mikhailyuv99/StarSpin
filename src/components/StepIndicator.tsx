"use client";

import type { PublicStep } from "@/lib/types";

const STEPS: { key: PublicStep; label: string; short: string }[] = [
  { key: "phone", label: "Téléphone", short: "Tel" },
  { key: "social", label: "Réseaux", short: "Social" },
  { key: "review", label: "Avis", short: "Avis" },
  { key: "wheel", label: "Roue", short: "Roue" },
  { key: "result", label: "Prix", short: "Prix" },
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
  const currentStep = STEPS[currentIndex];

  return (
    <div className="mb-5 sm:mb-8">
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-white/90">
        Étape {currentIndex + 1}/5 · {currentStep?.label}
      </p>
      <div className="flex justify-center gap-1.5 sm:gap-2">
        {STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <div key={step.key} className="flex min-w-0 flex-1 max-w-[3.5rem] flex-col items-center gap-1">
              <div
                className="flex h-9 w-full items-center justify-center rounded-sm text-xs font-bold sm:h-10"
                style={{
                  backgroundColor: done || active ? accent : "rgba(255,255,255,0.2)",
                  color: done || active ? "#fff" : "rgba(255,255,255,0.85)",
                  border: active ? "2px solid #fff" : "1px solid rgba(255,255,255,0.35)",
                }}
                aria-current={active ? "step" : undefined}
              >
                {done ? "✓" : i + 1}
              </div>
              <span className="w-full truncate text-center text-[9px] font-medium uppercase tracking-wide text-white/80 sm:text-[10px]">
                {step.short}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
