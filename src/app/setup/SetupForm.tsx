"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { SocialIcon } from "@/components/icons/SocialIcons";
import { ui } from "@/components/ui/styles";
import { RESERVED_SLUGS } from "@/lib/app-url";
import { normalizeGoogleReviewLink, sanitizeGooglePlaceId } from "@/lib/google-place-id";
import { resolveGooglePlaceIdViaApi } from "@/lib/resolve-google-place-client";
import type { FlowActionStep } from "@/lib/flow-steps";
import { useTranslations } from "@/i18n/client";

type WizardStep = 1 | 2 | 3;

function slugFromName(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "my-business"
  );
}

function normalizeInstagramUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("@")) return `https://instagram.com/${trimmed.slice(1)}`;
  if (trimmed.includes("instagram.com")) {
    return trimmed.startsWith("//") ? `https:${trimmed}` : `https://${trimmed.replace(/^\/\//, "")}`;
  }
  return `https://instagram.com/${trimmed.replace(/^@/, "")}`;
}

async function pickAvailableSlug(
  supabase: ReturnType<typeof createClient>,
  base: string,
): Promise<string | null> {
  let candidate = base;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (RESERVED_SLUGS.has(candidate)) {
      candidate = `${base}-${attempt + 2}`;
      continue;
    }
    const { data } = await supabase.from("merchants").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${attempt + 2}`;
  }
  return null;
}

export function SetupForm() {
  const t = useTranslations();
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [name, setName] = useState("");
  const [googleLink, setGoogleLink] = useState("");
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepMeta = useMemo(
    () =>
      [
        {
          title: t("setup.stepNameTitle"),
          subtitle: t("setup.stepNameSubtitle"),
          icon: null as null,
        },
        {
          title: t("setup.stepGoogleTitle"),
          subtitle: t("setup.stepGoogleSubtitle"),
          icon: "google" as const,
        },
        {
          title: t("setup.stepInstagramTitle"),
          subtitle: t("setup.stepInstagramSubtitle"),
          icon: "instagram" as const,
        },
      ] as const,
    [t],
  );

  const current = stepMeta[step - 1];

  const goNext = () => {
    setError(null);
    setStep((value) => (value < 3 ? ((value + 1) as WizardStep) : value));
  };

  const finishSetup = async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(t("setup.notSignedIn"));
      setLoading(false);
      return;
    }

    const businessName = name.trim() || t("setup.defaultBusinessName");
    const baseSlug = slugFromName(businessName);
    const cleanSlug = await pickAvailableSlug(supabase, baseSlug);

    if (!cleanSlug) {
      setError(t("setup.slugUnavailable"));
      setLoading(false);
      return;
    }

    let googleReviewLink = normalizeGoogleReviewLink(googleLink) ?? googleLink.trim();
    let resolvedPlaceId = sanitizeGooglePlaceId(null, googleReviewLink);
    if (googleReviewLink && !resolvedPlaceId) {
      const resolved = await resolveGooglePlaceIdViaApi(googleReviewLink);
      resolvedPlaceId = resolved.placeId;
      if (resolved.normalizedLink) googleReviewLink = resolved.normalizedLink;
    }

    const instagramUrl = normalizeInstagramUrl(instagram);
    const social_links = instagramUrl ? { instagram: instagramUrl } : {};

    const flow_steps: FlowActionStep[] = [];
    if (googleReviewLink) flow_steps.push("google_review");
    if (instagramUrl) flow_steps.push("instagram");

    const { data: account, error: accountError } = await supabase
      .from("merchant_accounts")
      .insert({ owner_id: user.id })
      .select("id")
      .single();

    if (accountError || !account) {
      setError(accountError?.message ?? t("setup.accountCreateFailed"));
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("merchants").insert({
      name: businessName,
      slug: cleanSlug,
      owner_id: user.id,
      account_id: account.id,
      google_review_link: googleReviewLink || null,
      google_place_id: resolvedPlaceId,
      social_links,
      flow_steps: flow_steps.length > 0 ? flow_steps : ["google_review"],
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    const defaultPrizes = [
      { label: t("setup.defaultPrize1"), icon: "percent_10", probability_weight: 40, stock_remaining: null },
      { label: t("setup.defaultPrize2"), icon: "soda", probability_weight: 30, stock_remaining: 50 },
      { label: t("setup.defaultPrize3"), icon: "cupcake", probability_weight: 20, stock_remaining: 30 },
      { label: t("setup.defaultPrize4"), icon: "try_again", probability_weight: 10, stock_remaining: null },
    ];

    const { data: merchant } = await supabase
      .from("merchants")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (merchant) {
      await supabase.from("prizes").insert(
        defaultPrizes.map((prize) => ({ ...prize, merchant_id: merchant.id })),
      );
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleContinue = async () => {
    if (step === 1) {
      goNext();
      return;
    }
    if (step === 2) {
      if (googleLink.trim() && !normalizeGoogleReviewLink(googleLink) && !/^https?:\/\//i.test(googleLink.trim())) {
        setError(t("setup.googleLinkInvalid"));
        return;
      }
      goNext();
      return;
    }
    await finishSetup();
  };

  const handleSkip = async () => {
    if (step === 3) {
      await finishSetup();
      return;
    }
    goNext();
  };

  return (
    <div className={`${ui.card} space-y-6`}>
      <div className="space-y-3">
        <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
          {t("setup.onboardingStepLabel", { current: step, total: 3 })}
        </p>
        <div className="flex gap-2">
          {[1, 2, 3].map((value) => (
            <div
              key={value}
              className={`h-2 flex-1 rounded-full border-2 border-black ${
                value <= step ? "bg-[var(--c-yellow)]" : "bg-white"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {current.icon && <SocialIcon brand={current.icon} size={22} />}
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-ink">{current.title}</h2>
        </div>
        <p className="text-sm font-medium text-muted">{current.subtitle}</p>
      </div>

      {error && <p className={ui.alertError}>{error}</p>}

      {step === 1 && (
        <div>
          <label className={ui.label}>{t("setup.businessName")}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={ui.input}
            placeholder={t("setup.stepNamePlaceholder")}
            autoFocus
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div className="rounded-[14px] border-2 border-black bg-[var(--c-lavender)]/40 p-4 text-sm font-medium leading-relaxed text-ink">
            {t("setup.stepGoogleHowTo")}
          </div>
          <div>
            <label className={`${ui.label} inline-flex items-center gap-2`}>
              <SocialIcon brand="google" size={16} />
              {t("dashboard.googleReviewLink")}
            </label>
            <input
              value={googleLink}
              onChange={(e) => setGoogleLink(e.target.value)}
              className={ui.input}
              placeholder={t("setup.stepGooglePlaceholder")}
              autoFocus
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <label className={`${ui.label} inline-flex items-center gap-2`}>
            <SocialIcon brand="instagram" size={16} />
            {t("dashboard.instagramUrl")}
          </label>
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className={ui.input}
            placeholder={t("setup.stepInstagramPlaceholder")}
            autoFocus
          />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading}
          className={`flex-1 ${ui.btnYellow}`}
        >
          {loading
            ? t("setup.creating")
            : step === 3
              ? t("setup.finish")
              : t("setup.continue")}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={loading}
          className={`flex-1 ${ui.btnOutline}`}
        >
          {t("setup.skip")}
        </button>
      </div>
    </div>
  );
}
