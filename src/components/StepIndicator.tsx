"use client";

import type { PublicStep } from "@/lib/types";
import { useTranslations } from "@/i18n/client";

const ORDER: PublicStep[] = ["social", "review", "wheel", "claim", "result"];

export function StepIndicator({
  current,
}: {
  current: PublicStep;
  accent?: string;
}) {
  const t = useTranslations();
  const STEPS: { key: PublicStep; label: string; short: string }[] = [
    { key: "social", label: t("public.stepSocial"), short: t("public.stepSocial") },
    { key: "review", label: t("public.stepReview"), short: t("public.stepReview") },
    { key: "wheel", label: t("public.stepWheel"), short: t("public.stepWheel") },
    { key: "claim", label: t("public.stepClaim"), short: t("public.stepClaim") },
    { key: "result", label: t("public.stepPrize"), short: t("public.stepPrize") },
  ];

  const currentIndex = ORDER.indexOf(current);
  const currentStep = STEPS[currentIndex];

  return (
    <div className="mb-5 sm:mb-6">
      <p className="mb-3 text-center text-xs font-extrabold uppercase tracking-wider text-muted">
        {t("public.stepOf", { current: currentIndex + 1, label: currentStep?.label ?? "" })}
      </p>
      <div className="flex justify-center gap-1 sm:gap-1.5">
        {STEPS.map((step, i) => {
          const onResult = current === "result";
          const done = onResult ? true : i < currentIndex;
          const active = !onResult && i === currentIndex;
          const state = done ? (active ? "active" : "done") : "idle";
          return (
            <div key={step.key} className="flex min-w-0 max-w-[3.5rem] flex-1 flex-col items-center gap-1">
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
                {step.short}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
