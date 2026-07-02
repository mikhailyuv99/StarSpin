"use client";

import { useMemo, useState } from "react";
import { SocialIcon, type SocialBrand } from "@/components/icons/SocialIcons";
import { contrastTextColor } from "@/lib/wheel";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ui } from "@/components/ui/styles";
import { useTranslations } from "@/i18n/client";
import { RESERVED_SLUGS } from "@/lib/app-url";
import {
  FLOW_ACTION_STEPS,
  normalizeFlowSteps,
  type FlowActionStep,
} from "@/lib/flow-steps";
import type { Merchant } from "@/lib/types";
import "@/components/marketing/cadeo-styles.css";

const STEP_PILL: Partial<Record<FlowActionStep, string>> = {
  google_review: "cadeo-visit-pill--google",
  instagram: "cadeo-visit-pill--insta",
  facebook: "cadeo-visit-pill--facebook",
  tiktok: "cadeo-visit-pill--tiktok",
  tripadvisor: "cadeo-visit-pill--tripadvisor",
};

function stepBrand(step: FlowActionStep): SocialBrand {
  return step === "google_review" ? "google" : step;
}

function cleanSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

type LinkKey =
  | "google_review_link"
  | "google_place_id"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "tripadvisor";

function linkLabelForKey(t: (key: string) => string, key: LinkKey): string {
  const labels: Record<LinkKey, string> = {
    google_review_link: t("dashboard.googleReviewLink"),
    google_place_id: t("dashboard.googlePlaceId"),
    instagram: t("dashboard.instagramUrl"),
    facebook: t("dashboard.facebookUrl"),
    tiktok: t("dashboard.tiktokUrl"),
    tripadvisor: t("dashboard.tripadvisorUrl"),
  };
  return labels[key];
}

function linkKeyForStep(step: FlowActionStep): LinkKey | null {
  if (step === "google_review") return "google_review_link";
  if (step === "instagram") return "instagram";
  if (step === "facebook") return "facebook";
  if (step === "tiktok") return "tiktok";
  if (step === "tripadvisor") return "tripadvisor";
  return null;
}

export function JourneySettingsForm({ merchant }: { merchant: Merchant }) {
  const t = useTranslations();
  const router = useRouter();
  const [steps, setSteps] = useState<FlowActionStep[]>(normalizeFlowSteps(merchant.flow_steps));
  const [form, setForm] = useState({
    name: merchant.name,
    slug: merchant.slug,
    primary_color: merchant.primary_color,
    secondary_color: merchant.secondary_color,
    google_review_link: merchant.google_review_link ?? "",
    google_place_id: merchant.google_place_id ?? "",
    instagram: merchant.social_links.instagram ?? "",
    facebook: merchant.social_links.facebook ?? "",
    tiktok: merchant.social_links.tiktok ?? "",
    tripadvisor: merchant.social_links.tripadvisor ?? "",
    logo_url: merchant.logo_url ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const disabledSteps = useMemo(
    () => FLOW_ACTION_STEPS.filter((step) => !steps.includes(step)),
    [steps],
  );

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const move = (index: number, direction: -1 | 1) => {
    setSteps((prev) => {
      const next = index + direction;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  };

  const removeStep = (step: FlowActionStep) => {
    setSteps((prev) => prev.filter((s) => s !== step));
  };

  const addStep = (step: FlowActionStep) => {
    setSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  };

  const handleLogoUpload = async (file: File) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("merchant-logos").upload(path, file, {
      upsert: true,
    });
    if (uploadError) {
      setError(uploadError.message);
      return;
    }
    const { data } = supabase.storage.from("merchant-logos").getPublicUrl(path);
    update("logo_url", data.publicUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (steps.length === 0) {
      setError(t("dashboard.flowStepsRequired"));
      return;
    }

    const slug = cleanSlug(form.slug);
    if (!slug) {
      setError(t("dashboard.slugInvalid"));
      return;
    }
    if (RESERVED_SLUGS.has(slug)) {
      setError(t("setup.slugReserved"));
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    const supabase = createClient();

    if (slug !== merchant.slug) {
      const { data: taken } = await supabase
        .from("merchants")
        .select("id")
        .eq("slug", slug)
        .neq("id", merchant.id)
        .maybeSingle();
      if (taken) {
        setLoading(false);
        setError(t("dashboard.slugTaken"));
        return;
      }
    }

    const social_links = {
      instagram: form.instagram || undefined,
      facebook: form.facebook || undefined,
      tiktok: form.tiktok || undefined,
      tripadvisor: form.tripadvisor || undefined,
    };

    const { error: updateError } = await supabase
      .from("merchants")
      .update({
        name: form.name,
        slug,
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        google_review_link: form.google_review_link || null,
        google_place_id: form.google_place_id || null,
        social_links,
        logo_url: form.logo_url || null,
        flow_steps: steps,
      })
      .eq("id", merchant.id);

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage(t("common.saved"));
    router.refresh();
  };

  const previewTotal = steps.length + 1;

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {message && <p className={ui.alertSuccess}>{message}</p>}
      {error && <p className={ui.alertError}>{error}</p>}

      <section className={`${ui.card} space-y-5`}>
        <h2 className={ui.h2}>{t("dashboard.journeyIdentity")}</h2>

        <div>
          <label className={ui.label}>{t("setup.businessName")}</label>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} className={ui.input} />
        </div>

        <div>
          <label className={ui.label}>{t("setup.publicUrl")}</label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm font-bold text-muted">starspin.cc/</span>
            <input
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              className={ui.input}
              spellCheck={false}
            />
          </div>
          <p className="mt-1 text-xs font-medium text-muted">{t("dashboard.slugHint")}</p>
        </div>

        <div>
          <label className={ui.label}>{t("dashboard.logo")}</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleLogoUpload(f);
            }}
            className={ui.file}
          />
          {form.logo_url && (
            <img
              src={form.logo_url}
              alt="Logo"
              className="mt-3 h-16 w-16 rounded-[14px] border-2 border-black object-cover"
            />
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={ui.label}>{t("dashboard.primaryColor")}</label>
            <input
              type="color"
              value={form.primary_color}
              onChange={(e) => update("primary_color", e.target.value)}
              className="h-12 w-full cursor-pointer rounded-[14px] border-2 border-black bg-white p-1"
            />
          </div>
          <div className="space-y-2">
            <label className={ui.label}>{t("dashboard.secondaryColor")}</label>
            <input
              type="color"
              value={form.secondary_color}
              onChange={(e) => update("secondary_color", e.target.value)}
              className="h-12 w-full cursor-pointer rounded-[14px] border-2 border-black bg-white p-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <span
            className="brutal-btn w-full justify-center text-sm"
            style={{
              backgroundColor: form.primary_color,
              color: contrastTextColor(form.primary_color),
            }}
          >
            {t("dashboard.colorPreviewPrimary")}
          </span>
          <span
            className="brutal-btn w-full justify-center text-sm"
            style={{
              backgroundColor: form.secondary_color,
              color: contrastTextColor(form.secondary_color),
            }}
          >
            {t("dashboard.colorPreviewSecondary")}
          </span>
        </div>
      </section>

      <section className={`${ui.card} space-y-5`}>
        <div>
          <h2 className={ui.h2}>{t("dashboard.flowTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("dashboard.flowStepsHint")}</p>
        </div>

        <div className="journey-flow-preview">
          {steps.map((step, i) => (
            <div key={step} className="journey-flow-preview-card">
              <span className="cadeo-visit-step">{String(i + 1).padStart(2, "0")}</span>
              <div className="cadeo-visit-xp" aria-hidden>
                <div
                  className="cadeo-visit-xp-fill"
                  style={{ width: `${((i + 1) / previewTotal) * 100}%` }}
                />
              </div>
              <span className={`cadeo-visit-pill ${STEP_PILL[step] ?? "cadeo-visit-pill--google"}`}>
                <span className="cadeo-visit-pill-icon">
                  <SocialIcon brand={stepBrand(step)} size={20} />
                </span>
                <span className="cadeo-visit-pill-text">{t(`dashboard.flowStep_${step}`)}</span>
              </span>
            </div>
          ))}
          <div className="journey-flow-preview-card">
            <span className="cadeo-visit-step">{String(steps.length + 1).padStart(2, "0")}</span>
            <div className="cadeo-visit-xp" aria-hidden>
              <div className="cadeo-visit-xp-fill" style={{ width: "100%" }} />
            </div>
            <span className="cadeo-visit-pill cadeo-visit-pill--yellow">
              <span className="cadeo-visit-pill-text">{t("public.stepWheel")}</span>
            </span>
          </div>
        </div>

        <ul className="space-y-3">
          {steps.map((step, index) => {
            const linkKey = linkKeyForStep(step);
            return (
              <li key={step} className="rounded-[14px] border-2 border-black bg-white p-4 shadow-[3px_3px_0_0_#0a0a0a]">
                <div className="flex flex-wrap items-center gap-3">
                  <SocialIcon brand={stepBrand(step)} size={20} />
                  <span className="min-w-0 flex-1 font-extrabold text-ink">
                    {t(`dashboard.flowStep_${step}`)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index <= 0}
                      className="brutal-btn brutal-btn-white !px-2 !py-1 text-sm disabled:opacity-40"
                      aria-label={t("dashboard.flowMoveUp")}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index >= steps.length - 1}
                      className="brutal-btn brutal-btn-white !px-2 !py-1 text-sm disabled:opacity-40"
                      aria-label={t("dashboard.flowMoveDown")}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStep(step)}
                      className="brutal-btn brutal-btn-white !px-2 !py-1 text-sm"
                      aria-label={t("dashboard.flowRemoveStep")}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {linkKey && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className={`${ui.label} inline-flex items-center gap-2`}>
                        <SocialIcon brand={stepBrand(step)} size={16} />
                        {linkLabelForKey(t, linkKey)}
                      </label>
                      <input
                        value={form[linkKey]}
                        onChange={(e) => update(linkKey, e.target.value)}
                        className={ui.input}
                      />
                    </div>
                    {step === "google_review" && (
                      <div>
                        <label className={ui.label}>{t("dashboard.googlePlaceId")}</label>
                        <input
                          value={form.google_place_id}
                          onChange={(e) => update("google_place_id", e.target.value)}
                          className={ui.input}
                        />
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {disabledSteps.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {disabledSteps.map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => addStep(step)}
                className="brutal-btn brutal-btn-white text-sm"
              >
                + {t(`dashboard.flowStep_${step}`)}
              </button>
            ))}
          </div>
        )}
      </section>

      <button type="submit" disabled={loading} className={ui.btn}>
        {loading ? t("common.saving") : t("common.save")}
      </button>
    </form>
  );
}
