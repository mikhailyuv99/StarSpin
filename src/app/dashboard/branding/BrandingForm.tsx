"use client";

import { useState } from "react";
import { SocialIcon, type SocialBrand } from "@/components/icons/SocialIcons";
import { LogoUploadField } from "@/components/dashboard/LogoUploadField";
import { contrastTextColor } from "@/lib/wheel";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ui } from "@/components/ui/styles";
import { useTranslations } from "@/i18n/client";
import { extractGooglePlaceId, normalizeGoogleReviewLink, sanitizeGooglePlaceId } from "@/lib/google-place-id";
import { resolveGooglePlaceIdViaApi } from "@/lib/resolve-google-place-client";

export function BrandingForm({
  merchant,
}: {
  merchant: import("@/lib/types").Merchant;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [form, setForm] = useState({
    name: merchant.name,
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

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleLogoUpload = async (file: File) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("merchant-logos").upload(path, file, {
      upsert: true,
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    const { data } = supabase.storage.from("merchant-logos").getPublicUrl(path);
    update("logo_url", data.publicUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const social_links = {
      instagram: form.instagram || undefined,
      facebook: form.facebook || undefined,
      tiktok: form.tiktok || undefined,
      tripadvisor: form.tripadvisor || undefined,
    };

    const supabase = createClient();

    let googleReviewLink = normalizeGoogleReviewLink(form.google_review_link) ?? form.google_review_link.trim();
    // Always re-resolve from the Maps link — never prefer a stale stored Place ID.
    let resolvedPlaceId: string | null = extractGooglePlaceId(googleReviewLink);
    if (!resolvedPlaceId && googleReviewLink) {
      const resolved = await resolveGooglePlaceIdViaApi(googleReviewLink);
      resolvedPlaceId = resolved.placeId;
      if (resolved.normalizedLink) googleReviewLink = resolved.normalizedLink;
    }
    if (!resolvedPlaceId) {
      resolvedPlaceId = sanitizeGooglePlaceId(null, googleReviewLink);
    }

    const { error } = await supabase
      .from("merchants")
      .update({
        name: form.name,
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        google_review_link: googleReviewLink || null,
        google_place_id: resolvedPlaceId,
        social_links,
        logo_url: form.logo_url || null,
      })
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
    <form onSubmit={handleSubmit} className={`${ui.card} max-w-xl space-y-5`}>
      {message && <p className={ui.alertSuccess}>{message}</p>}

      <div>
        <label className={ui.label}>{t("setup.businessName")}</label>
        <input
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className={ui.input}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={ui.label}>{t("dashboard.primaryColor")}</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.primary_color}
              onChange={(e) => update("primary_color", e.target.value)}
              className="h-12 w-full min-w-0 flex-1 cursor-pointer rounded-[14px] border-2 border-black bg-white p-1"
            />
            <span
              className="inline-flex h-12 min-w-[5.5rem] items-center justify-center rounded-[14px] border-2 border-black px-3 text-xs font-extrabold uppercase shadow-[3px_3px_0_0_#0a0a0a]"
              style={{ backgroundColor: form.primary_color, color: contrastTextColor(form.primary_color) }}
            >
              Primary
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <label className={ui.label}>{t("dashboard.secondaryColor")}</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.secondary_color}
              onChange={(e) => update("secondary_color", e.target.value)}
              className="h-12 w-full min-w-0 flex-1 cursor-pointer rounded-[14px] border-2 border-black bg-white p-1"
            />
            <span
              className="inline-flex h-12 min-w-[5.5rem] items-center justify-center rounded-[14px] border-2 border-black px-3 text-xs font-extrabold uppercase shadow-[3px_3px_0_0_#0a0a0a]"
              style={{ backgroundColor: form.secondary_color, color: contrastTextColor(form.secondary_color) }}
            >
              Secondary
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <span
          className="brutal-btn text-sm"
          style={{ backgroundColor: form.primary_color, color: contrastTextColor(form.primary_color) }}
        >
          Spin button preview
        </span>
        <span className="brutal-btn brutal-btn-white text-sm" style={{ borderColor: form.secondary_color }}>
          Outline preview
        </span>
      </div>

      <LogoUploadField
        label={t("dashboard.logo")}
        logoUrl={form.logo_url || null}
        onUpload={handleLogoUpload}
      />

      {(
        [
          { key: "instagram", label: t("dashboard.instagramUrl"), brand: "instagram" as SocialBrand },
          { key: "facebook", label: t("dashboard.facebookUrl"), brand: "facebook" as SocialBrand },
          { key: "tiktok", label: t("dashboard.tiktokUrl"), brand: "tiktok" as SocialBrand },
          { key: "tripadvisor", label: t("dashboard.tripadvisorUrl"), brand: "tripadvisor" as SocialBrand },
          { key: "google_review_link", label: t("dashboard.googleReviewLink"), brand: "google" as SocialBrand },
        ] as const
      ).map((field) => (
        <div key={field.key}>
          <label className={`${ui.label} inline-flex items-center gap-2`}>
            {"brand" in field && <SocialIcon brand={field.brand} size={16} />}
            {field.label}
          </label>
          <input
            value={form[field.key as keyof typeof form]}
            onChange={(e) => update(field.key, e.target.value)}
            className={ui.input}
          />
        </div>
      ))}

      <button type="submit" disabled={loading} className={ui.btn}>
        {loading ? t("common.saving") : t("common.save")}
      </button>
    </form>
  );
}
