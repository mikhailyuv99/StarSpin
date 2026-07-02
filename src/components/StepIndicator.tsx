"use client";

import type { PublicStep } from "@/lib/types";
import { isSocialFlowStep } from "@/lib/flow-steps";
import { useTranslations } from "@/i18n/client";

function stepLabel(step: PublicStep, t: (key: string) => string): string {
  if (step === "wheel") return t("public.stepWheel");
  if (step === "claim") return t("public.stepClaim");
  if (step === "result") return t("public.stepPrize");
  if (step === "google_review") return t("public.stepReview");
  if (isSocialFlowStep(step)) return t(`public.step_${step}`);
  return step;
}

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
  const currentIndex = displaySteps.indexOf(current === "result" ? "claim" : current);

  return (
    <div className="mb-5 sm:mb-6">
      <p className="mb-3 text-center text-xs font-extrabold uppercase tracking-wider text-muted">
        {t("public.stepOf", {
          current: current === "result" ? displaySteps.length : currentIndex + 1,
          label: stepLabel(current === "result" ? "claim" : current, t),
        })}
      </p>
      <div className="flex justify-center gap-1 sm:gap-1.5">
        {displaySteps.map((step, i) => {
          const onResult = current === "result";
          const done = onResult ? true : i < currentIndex;
          const active = !onResult && i === currentIndex;
          const state = done ? (active ? "active" : "done") : "idle";
          const short = stepLabel(step, t);

          return (
            <div key={`${step}-${i}`} className="flex min-w-0 max-w-[3.5rem] flex-1 flex-col items-center gap-1">
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
              >
                {done ? "✓" : i + 1}
              </div>
              <span className="w-full truncate text-center text-[8px] font-bold uppercase tracking-wide text-muted sm:text-[9px]">
                {short}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
