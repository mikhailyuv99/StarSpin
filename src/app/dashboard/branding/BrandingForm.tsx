"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ui } from "@/components/ui/styles";
import { useTranslations } from "@/i18n/client";

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
    };

    const supabase = createClient();
    const { error } = await supabase
      .from("merchants")
      .update({
        name: form.name,
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        google_review_link: form.google_review_link || null,
        google_place_id: form.google_place_id || null,
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={ui.label}>{t("dashboard.primaryColor")}</label>
          <input
            type="color"
            value={form.primary_color}
            onChange={(e) => update("primary_color", e.target.value)}
            className="h-10 w-full cursor-pointer rounded-sm border border-border bg-white p-1"
          />
        </div>
        <div>
          <label className={ui.label}>{t("dashboard.secondaryColor")}</label>
          <input
            type="color"
            value={form.secondary_color}
            onChange={(e) => update("secondary_color", e.target.value)}
            className="h-10 w-full cursor-pointer rounded-sm border border-border bg-white p-1"
          />
        </div>
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
            className="mt-3 h-14 w-14 rounded-sm border border-border object-cover"
          />
        )}
      </div>

      {[
        { key: "instagram", label: t("dashboard.instagramUrl") },
        { key: "facebook", label: t("dashboard.facebookUrl") },
        { key: "tiktok", label: t("dashboard.tiktokUrl") },
        { key: "google_review_link", label: t("dashboard.googleReviewLink") },
        { key: "google_place_id", label: t("dashboard.googlePlaceId") },
      ].map((field) => (
        <div key={field.key}>
          <label className={ui.label}>{field.label}</label>
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
