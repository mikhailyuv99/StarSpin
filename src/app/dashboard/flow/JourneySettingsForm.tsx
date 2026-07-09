"use client";

import { useMemo, useState } from "react";
import { SocialIcon, type SocialBrand } from "@/components/icons/SocialIcons";
import { JourneyWheelIcon } from "@/components/dashboard/JourneyWheelIcon";
import { JourneyThemePicker } from "@/components/dashboard/JourneyThemePicker";
import { LogoUploadField } from "@/components/dashboard/LogoUploadField";
import { parseJourneyTheme, type JourneyTemplateId } from "@/lib/journey-theme";
import { extractGooglePlaceId, normalizeGoogleReviewLink, sanitizeGooglePlaceId } from "@/lib/google-place-id";
import { resolveGooglePlaceIdViaApi } from "@/lib/resolve-google-place-client";
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
import type { Merchant, Prize } from "@/lib/types";

const STEP_ACCENT: Record<FlowActionStep, string> = {
  google_review: "#9b7fe8",
  instagram: "#fbbf24",
  facebook: "#f472b6",
  tiktok: "#2dd4bf",
  tripadvisor: "#6ee7b7",
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

type LinkKey = "google_review_link" | "instagram" | "facebook" | "tiktok" | "tripadvisor";

function linkLabelForKey(t: (key: string) => string, key: LinkKey): string {
  const labels: Record<LinkKey, string> = {
    google_review_link: t("dashboard.googleReviewLink"),
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
  const initialTheme = useMemo(() => parseJourneyTheme(merchant.journey_theme), [merchant.journey_theme]);
  const [journeyTemplate, setJourneyTemplate] = useState<JourneyTemplateId>(initialTheme.template);
  const [journeyAccent, setJourneyAccent] = useState<string>(initialTheme.accent ?? "");
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
    customer_page_headline: merchant.customer_page_headline ?? "",
    customer_page_subtitle: merchant.customer_page_subtitle ?? "",
    spin_button_label: merchant.spin_button_label ?? "",
  });
  const [placeIdWarning, setPlaceIdWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const disabledSteps = useMemo(
    () => FLOW_ACTION_STEPS.filter((step) => !steps.includes(step)),
    [steps],
  );

  // Live merchant fed to the theme picker's phone preview — mirrors the form.
  const previewMerchant = useMemo<Merchant>(
    () => ({
      ...merchant,
      name: form.name || merchant.name,
      slug: form.slug || merchant.slug,
      primary_color: form.primary_color,
      secondary_color: form.secondary_color,
      logo_url: form.logo_url || null,
      google_review_link: form.google_review_link || null,
      social_links: {
        instagram: form.instagram || undefined,
        facebook: form.facebook || undefined,
        tiktok: form.tiktok || undefined,
        tripadvisor: form.tripadvisor || undefined,
      },
      flow_steps: steps,
      customer_page_headline: form.customer_page_headline || null,
      customer_page_subtitle: form.customer_page_subtitle || null,
      spin_button_label: form.spin_button_label || null,
    }),
    [merchant, form, steps],
  );

  const previewPrizes = useMemo<Prize[]>(() => {
    const base = {
      merchant_id: merchant.id,
      stock_remaining: null,
      active: true,
      created_at: "",
    } as const;
    return [
      { ...base, id: "pp1", label: t("dashboard.previewPrize1"), icon: "coffee_cup", probability_weight: 30 },
      { ...base, id: "pp2", label: t("dashboard.previewPrize2"), icon: "percent_10", probability_weight: 25 },
      { ...base, id: "pp3", label: t("dashboard.previewPrize3"), icon: "cupcake", probability_weight: 20 },
      { ...base, id: "pp4", label: t("dashboard.previewPrize4"), icon: "percent_20", probability_weight: 15 },
      { ...base, id: "pp5", label: t("dashboard.previewPrize5"), icon: "gift", probability_weight: 7 },
      { ...base, id: "pp6", label: t("dashboard.previewPrize6"), icon: "soda", probability_weight: 3 },
    ];
  }, [merchant.id, t]);

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const syncPlaceIdFromLink = (link: string) => {
    const extracted = extractGooglePlaceId(link);
    if (extracted) {
      setForm((prev) => ({ ...prev, google_place_id: extracted }));
      setPlaceIdWarning(false);
      return;
    }
    setForm((prev) => ({ ...prev, google_place_id: "" }));
    setPlaceIdWarning(Boolean(link.trim()));
  };

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

    let googleReviewLink = normalizeGoogleReviewLink(form.google_review_link) ?? form.google_review_link.trim();
    // Always re-resolve from the Maps link. A previously saved Place ID can be
    // a wrong same-name venue (e.g. US vs Da Nang) and must not win on save.
    let resolvedPlaceId: string | null = extractGooglePlaceId(googleReviewLink);
    if (!resolvedPlaceId && googleReviewLink) {
      const resolved = await resolveGooglePlaceIdViaApi(googleReviewLink);
      resolvedPlaceId = resolved.placeId;
      if (resolved.normalizedLink) googleReviewLink = resolved.normalizedLink;
    }
    if (!resolvedPlaceId) {
      resolvedPlaceId = sanitizeGooglePlaceId(null, googleReviewLink);
    }

    const { error: updateError } = await supabase
      .from("merchants")
      .update({
        name: form.name,
        slug,
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        google_review_link: googleReviewLink || null,
        google_place_id: resolvedPlaceId,
        social_links,
        logo_url: form.logo_url || null,
        flow_steps: steps,
        customer_page_headline: form.customer_page_headline.trim() || null,
        customer_page_subtitle: form.customer_page_subtitle.trim() || null,
        spin_button_label: form.spin_button_label.trim() || null,
        journey_theme: {
          v: 1,
          template: journeyTemplate,
          accent: journeyAccent.trim() || null,
        },
      })
      .eq("id", merchant.id);

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    if (resolvedPlaceId) {
      setPlaceIdWarning(false);
    }
    setMessage(t("common.saved"));
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
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

        <LogoUploadField
          label={t("dashboard.logo")}
          logoUrl={form.logo_url || null}
          onUpload={handleLogoUpload}
        />
      </section>

      <section className={`${ui.card} space-y-5`}>
        <div>
          <h2 className={ui.h2}>{t("dashboard.journeyThemeTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("dashboard.journeyThemeSubtitle")}</p>
        </div>
        <JourneyThemePicker
          template={journeyTemplate}
          accent={journeyAccent}
          onTemplateChange={setJourneyTemplate}
          onAccentChange={setJourneyAccent}
          previewMerchant={previewMerchant}
          previewPrizes={previewPrizes}
        />
        <button type="submit" disabled={loading} className={ui.btn}>
          {loading ? t("common.saving") : t("common.save")}
        </button>
      </section>

      <section className={`${ui.card} space-y-5`}>
        <div>
          <h2 className={ui.h2}>{t("dashboard.journeyCopyTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("dashboard.journeyCopySubtitle")}</p>
        </div>

        <div>
          <label className={ui.label}>{t("dashboard.customerPageHeadline")}</label>
          <input
            value={form.customer_page_headline}
            onChange={(e) => update("customer_page_headline", e.target.value)}
            className={ui.input}
            placeholder={form.name || merchant.name}
          />
          <p className="mt-1 text-xs font-medium text-muted">{t("dashboard.customerPageHeadlineHint")}</p>
        </div>

        <div>
          <label className={ui.label}>{t("dashboard.customerPageSubtitle")}</label>
          <input
            value={form.customer_page_subtitle}
            onChange={(e) => update("customer_page_subtitle", e.target.value)}
            className={ui.input}
            placeholder={t("public.headerSubtitle")}
          />
        </div>

        <div>
          <label className={ui.label}>{t("dashboard.spinButtonLabel")}</label>
          <input
            value={form.spin_button_label}
            onChange={(e) => update("spin_button_label", e.target.value)}
            className={ui.input}
            placeholder={t("public.spinButton")}
          />
        </div>
      </section>

      <section className={`${ui.card} space-y-5`}>
        <div>
          <h2 className={ui.h2}>{t("dashboard.flowTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("dashboard.flowStepsHint")}</p>
        </div>

        <div className="journey-preview" aria-label={t("dashboard.flowPreviewTitle")}>
          {steps.map((step, i) => (
            <div key={step} className="journey-preview-flow">
              <div
                className="journey-preview-step"
                style={{ ["--step-accent" as string]: STEP_ACCENT[step] }}
              >
                <span className="journey-preview-num">{i + 1}</span>
                <SocialIcon brand={stepBrand(step)} size={18} />
                <span className="journey-preview-label">{t(`dashboard.flowStep_${step}`)}</span>
              </div>
              <span className="journey-preview-arrow" aria-hidden>
                →
              </span>
            </div>
          ))}
          <div className="journey-preview-step journey-preview-step--wheel">
            <span className="journey-preview-num">{steps.length + 1}</span>
            <JourneyWheelIcon size={24} />
            <span className="journey-preview-label">{t("public.stepWheel")}</span>
          </div>
        </div>

        <ul className="journey-step-list">
          {steps.map((step, index) => {
            const linkKey = linkKeyForStep(step);
            return (
              <li
                key={step}
                className="journey-step"
                style={{ ["--step-accent" as string]: STEP_ACCENT[step] }}
              >
                <div className="journey-step-header">
                  <div className="journey-step-leading">
                    <span className="journey-step-num">{index + 1}</span>
                    <SocialIcon brand={stepBrand(step)} size={22} />
                    <span className="journey-step-title">{t(`dashboard.flowStep_${step}`)}</span>
                  </div>
                  <div className="journey-step-actions">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index <= 0}
                      className="journey-step-action"
                      aria-label={t("dashboard.flowMoveUp")}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index >= steps.length - 1}
                      className="journey-step-action"
                      aria-label={t("dashboard.flowMoveDown")}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStep(step)}
                      className="journey-step-action journey-step-action--danger"
                      aria-label={t("dashboard.flowRemoveStep")}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {linkKey && (
                  <div className="journey-step-fields">
                    <div>
                      <label className={`${ui.label} inline-flex items-center gap-2`}>
                        <SocialIcon brand={stepBrand(step)} size={16} />
                        {linkLabelForKey(t, linkKey)}
                      </label>
                      <input
                        value={form[linkKey]}
                        onBlur={() => {
                          if (step !== "google_review") return;
                          const normalized = normalizeGoogleReviewLink(form.google_review_link);
                          if (normalized && normalized !== form.google_review_link) {
                            update("google_review_link", normalized);
                            syncPlaceIdFromLink(normalized);
                          }
                        }}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (step === "google_review") {
                            update("google_review_link", value);
                            syncPlaceIdFromLink(value);
                          } else {
                            update(linkKey, value);
                          }
                        }}
                        className={ui.input}
                        placeholder={
                          step === "google_review"
                            ? t("dashboard.googleReviewLinkPlaceholder")
                            : undefined
                        }
                      />
                      {step === "google_review" && (
                        <>
                          <p className="mt-2 text-xs font-medium leading-relaxed text-muted">
                            {t("dashboard.googleReviewLinkHint")}
                          </p>
                          {placeIdWarning && (
                            <p className="mt-1 text-xs font-bold text-amber-800">
                              {t("dashboard.googlePlaceIdFailed")}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {disabledSteps.length > 0 && (
          <div className="journey-add-steps">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
              {t("dashboard.flowAddStep")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
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
          </div>
        )}
      </section>

      <button type="submit" disabled={loading} className={ui.btn}>
        {loading ? t("common.saving") : t("common.save")}
      </button>
    </form>
  );
}
