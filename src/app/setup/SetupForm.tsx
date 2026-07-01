"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ui } from "@/components/ui/styles";

export function SetupForm() {
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
      setError("Non connecté");
      setLoading(false);
      return;
    }

    const cleanSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

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
      { label: "10% de réduction", probability_weight: 40, stock_remaining: null },
      { label: "Boisson offerte", probability_weight: 30, stock_remaining: 50 },
      { label: "Dessert offert", probability_weight: 20, stock_remaining: 30 },
      { label: "Perdu — réessayez !", probability_weight: 10, stock_remaining: null },
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
        <label className={ui.label}>Nom du commerce</label>
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
        <label className={ui.label}>URL publique</label>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted">/r/</span>
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
        {loading ? "Création…" : "Créer mon commerce"}
      </button>
    </form>
  );
}
