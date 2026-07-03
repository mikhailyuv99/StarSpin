"use client";

import type { PublicStep } from "@/lib/types";
import { journeyStepPosition } from "@/lib/flow-steps";
import { useTranslations } from "@/i18n/client";

export function StepIndicator({
  current,
  steps,
}: {
  current: PublicStep;
  steps: PublicStep[];
  accent?: string;
}) {
  const t = useTranslations();
  const displaySteps = steps.filter((s) => s !== "result");
  const position = journeyStepPosition(steps, current);

  const currentIndex = displaySteps.indexOf(current === "result" ? "claim" : current);

  return (
    <div className="mb-5 sm:mb-6">
      <p className="mb-3 text-center text-xs font-extrabold uppercase tracking-wider text-muted">
        {t("public.journeyStepHeading", {
          current: position.current,
          total: position.total,
        })}
      </p>
      <div className="flex justify-center gap-1 sm:gap-1.5">
        {displaySteps.map((step, i) => {
          const onResult = current === "result";
          const done = onResult ? true : i < currentIndex;
          const active = !onResult && i === currentIndex;
          const state = done ? (active ? "active" : "done") : "idle";

          return (
            <div key={`${step}-${i}`} className="flex min-w-0 max-w-[3.5rem] flex-1 flex-col items-center">
              <div
                className={`public-step-pill public-step-pill--${state}`}
                style={
                  done || active
                    ? {
                        backgroundColor: "#0a0a0a",
                        color: "#ffffff",
                        borderWidth: active ? 3 : 2,
                      }
                    : undefined
                }
                aria-current={active ? "step" : undefined}
                aria-label={t("public.journeyStepHeading", { current: i + 1, total: displaySteps.length })}
              >
                {done ? "✓" : i + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
