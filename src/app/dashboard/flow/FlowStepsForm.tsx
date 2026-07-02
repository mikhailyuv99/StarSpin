"use client";

import { useState } from "react";
import { SocialIcon } from "@/components/icons/SocialIcons";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ui } from "@/components/ui/styles";
import { useTranslations } from "@/i18n/client";
import {
  FLOW_ACTION_STEPS,
  isStepConfigured,
  normalizeFlowSteps,
  type FlowActionStep,
} from "@/lib/flow-steps";
import type { Merchant } from "@/lib/types";

export function FlowStepsForm({ merchant }: { merchant: Merchant }) {
  const t = useTranslations();
  const router = useRouter();
  const [steps, setSteps] = useState<FlowActionStep[]>(normalizeFlowSteps(merchant.flow_steps));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const enabled = (step: FlowActionStep) => steps.includes(step);

  const toggle = (step: FlowActionStep) => {
    setSteps((prev) => (prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step]));
  };

  const move = (step: FlowActionStep, direction: -1 | 1) => {
    setSteps((prev) => {
      const index = prev.indexOf(step);
      if (index < 0) return prev;
      const next = index + direction;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (steps.length === 0) {
      setMessage(t("dashboard.flowStepsRequired"));
      return;
    }

    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("merchants")
      .update({ flow_steps: steps })
      .eq("id", merchant.id);

    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage(t("common.saved"));
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className={`${ui.card} max-w-2xl space-y-5`}>
      {message && <p className={ui.alertSuccess}>{message}</p>}

      <p className="text-sm text-muted">{t("dashboard.flowStepsHint")}</p>

      <ul className="space-y-3">
        {FLOW_ACTION_STEPS.map((step) => {
          const on = enabled(step);
          const configured = isStepConfigured(step, merchant);
          const orderIndex = steps.indexOf(step);

          return (
            <li
              key={step}
              className={`rounded-[14px] border-2 border-black p-4 ${on ? "bg-white" : "bg-black/5"}`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(step)}
                    className="h-5 w-5 accent-black"
                  />
                  <SocialIcon brand={step === "google_review" ? "google" : step} size={20} />
                  <span className="font-extrabold text-ink">{t(`dashboard.flowStep_${step}`)}</span>
                </label>

                {on && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(step, -1)}
                      disabled={orderIndex <= 0}
                      className="brutal-btn brutal-btn-white !px-2 !py-1 text-sm"
                      aria-label={t("dashboard.flowMoveUp")}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(step, 1)}
                      disabled={orderIndex >= steps.length - 1}
                      className="brutal-btn brutal-btn-white !px-2 !py-1 text-sm"
                      aria-label={t("dashboard.flowMoveDown")}
                    >
                      ↓
                    </button>
                    <span className="ml-2 font-mono text-xs text-muted">
                      {t("dashboard.flowOrder", { n: orderIndex + 1 })}
                    </span>
                  </div>
                )}
              </div>

              {!configured && (
                <p className="mt-2 text-xs font-semibold text-amber-800">
                  {t("dashboard.flowStepMissingLink")}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="rounded-[14px] border-2 border-dashed border-black/30 bg-black/[0.03] p-4">
        <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
          {t("dashboard.flowPreviewTitle")}
        </p>
        <ol className="mt-2 space-y-1 text-sm font-semibold text-ink">
          {steps.map((step, i) => (
            <li key={step}>
              {i + 1}. {t(`dashboard.flowStep_${step}`)}
            </li>
          ))}
          <li>
            {steps.length + 1}. {t("public.stepWheel")}
          </li>
          <li>
            {steps.length + 2}. {t("public.stepClaim")}
          </li>
        </ol>
      </div>

      <button type="submit" disabled={loading} className={ui.btn}>
        {loading ? t("common.saving") : t("common.save")}
      </button>
    </form>
  );
}
