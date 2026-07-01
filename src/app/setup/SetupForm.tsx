"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ui } from "@/components/ui/styles";
import { RESERVED_SLUGS } from "@/lib/app-url";
import { useTranslations } from "@/i18n/client";

export function SetupForm() {
  const t = useTranslations();
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    const cleanSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (RESERVED_SLUGS.has(cleanSlug)) {
      setError(t("setup.slugReserved"));
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("merchants").insert({
      name,
      slug: cleanSlug,
      owner_id: user.id,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    const defaultPrizes = [
      { label: t("setup.defaultPrize1"), probability_weight: 40, stock_remaining: null },
      { label: t("setup.defaultPrize2"), probability_weight: 30, stock_remaining: 50 },
      { label: t("setup.defaultPrize3"), probability_weight: 20, stock_remaining: 30 },
      { label: t("setup.defaultPrize4"), probability_weight: 10, stock_remaining: null },
    ];

    const { data: merchant } = await supabase
      .from("merchants")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (merchant) {
      await supabase.from("prizes").insert(
        defaultPrizes.map((p) => ({ ...p, merchant_id: merchant.id })),
      );
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className={`${ui.card} space-y-5`}>
      {error && <p className={ui.alertError}>{error}</p>}
      <div>
        <label className={ui.label}>{t("setup.businessName")}</label>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slug) {
              setSlug(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, ""),
              );
            }
          }}
          required
          className={ui.input}
        />
      </div>
      <div>
        <label className={ui.label}>{t("setup.publicUrl")}</label>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted">/</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            pattern="[a-z0-9-]+"
            className={ui.input}
          />
        </div>
      </div>
      <button type="submit" disabled={loading} className={`w-full ${ui.btn}`}>
        {loading ? t("setup.creating") : t("setup.create")}
      </button>
    </form>
  );
}
