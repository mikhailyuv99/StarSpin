"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Merchant, SocialLinks } from "@/lib/types";
import { useRouter } from "next/navigation";

export function BrandingForm({ merchant }: { merchant: Merchant }) {
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

    const social_links: SocialLinks = {
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
    setMessage("Enregistré !");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-xl bg-white p-6 shadow-sm">
      {message && <p className="text-sm text-green-600">{message}</p>}
      <input
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        placeholder="Nom"
        className="w-full rounded-lg border px-4 py-2"
      />
      <div className="grid grid-cols-2 gap-4">
        <input
          type="color"
          value={form.primary_color}
          onChange={(e) => update("primary_color", e.target.value)}
          className="h-12 w-full rounded-lg border"
        />
        <input
          type="color"
          value={form.secondary_color}
          onChange={(e) => update("secondary_color", e.target.value)}
          className="h-12 w-full rounded-lg border"
        />
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleLogoUpload(f);
        }}
        className="w-full text-sm"
      />
      {form.logo_url && (
        <img src={form.logo_url} alt="Logo" className="h-16 w-16 rounded-full object-cover" />
      )}
      <input
        value={form.instagram}
        onChange={(e) => update("instagram", e.target.value)}
        placeholder="Instagram URL"
        className="w-full rounded-lg border px-4 py-2"
      />
      <input
        value={form.facebook}
        onChange={(e) => update("facebook", e.target.value)}
        placeholder="Facebook URL"
        className="w-full rounded-lg border px-4 py-2"
      />
      <input
        value={form.tiktok}
        onChange={(e) => update("tiktok", e.target.value)}
        placeholder="TikTok URL"
        className="w-full rounded-lg border px-4 py-2"
      />
      <input
        value={form.google_review_link}
        onChange={(e) => update("google_review_link", e.target.value)}
        placeholder="Lien avis Google"
        className="w-full rounded-lg border px-4 py-2"
      />
      <input
        value={form.google_place_id}
        onChange={(e) => update("google_place_id", e.target.value)}
        placeholder="Google Place ID (pour stats avis)"
        className="w-full rounded-lg border px-4 py-2"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-orange-600 px-6 py-2 font-semibold text-white disabled:opacity-50"
      >
        Enregistrer
      </button>
    </form>
  );
}
