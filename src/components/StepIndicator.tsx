"use client";

import type { PublicStep } from "@/lib/types";
import { journeyStepPosition } from "@/lib/flow-steps";
import { useTranslations } from "@/i18n/client";

export function StepIndicator({
  current,
  steps,
  onStepClick,
  showResult = false,
  forceMobileLayout = false,
}: {
  current: PublicStep;
  steps: PublicStep[];
  accent?: string;
  /** Preview only: jump to a step when a pill is tapped. */
  onStepClick?: (step: PublicStep) => void;
  /** Preview only: include the final result step in the pill row. */
  showResult?: boolean;
  /** Dashboard phone preview: use mobile breakpoints only (<640px). */
  forceMobileLayout?: boolean;
}) {
  const t = useTranslations();
  const displaySteps = steps.filter((s) => showResult || s !== "result");
  const position = journeyStepPosition(steps, current, { includeResult: showResult });

  const resolvedCurrent = current === "result" ? "result" : current;
  const onResult = current === "result";
  const currentIndex = onResult
    ? displaySteps.length
    : displaySteps.indexOf(resolvedCurrent);

  return (
    <div className={`mb-5${forceMobileLayout ? "" : " sm:mb-6"}${onStepClick ? " public-step-nav" : ""}`}>
      <p className="mb-3 text-center text-xs font-extrabold uppercase tracking-wider text-muted">
        {t("public.journeyStepHeading", {
          current: position.current,
          total: position.total,
        })}
      </p>
      <div className={`flex justify-center gap-1${forceMobileLayout ? "" : " sm:gap-1.5"}`}>
        {displaySteps.map((step, i) => {
          const onResult = current === "result";
          const done = onResult || i < currentIndex;
          const active = !onResult && i === currentIndex;
          const state = active ? "active" : done ? "done" : "idle";
          const label = t("public.journeyStepHeading", { current: i + 1, total: displaySteps.length });
          const pillClass = `public-step-pill public-step-pill--${state}${onStepClick ? " public-step-pill--nav" : ""}`;

          return (
            <div key={`${step}-${i}`} className="flex min-w-0 max-w-[3.5rem] flex-1 flex-col items-center">
              {onStepClick ? (
                <button
                  type="button"
                  className={pillClass}
                  aria-current={active ? "step" : undefined}
                  aria-label={label}
                  onClick={() => onStepClick(step)}
                >
                  {done && !active ? "✓" : step === "result" && active ? "★" : i + 1}
                </button>
              ) : (
                <div className={pillClass} aria-current={active ? "step" : undefined} aria-label={label}>
                  {done && !active ? "✓" : i + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
