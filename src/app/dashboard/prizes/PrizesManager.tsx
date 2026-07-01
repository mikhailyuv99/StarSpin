"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Prize } from "@/lib/types";
import { useRouter } from "next/navigation";
import { ui } from "@/components/ui/styles";

export function PrizesManager({
  merchantId,
  initialPrizes,
}: {
  merchantId: string;
  initialPrizes: Prize[];
}) {
  const router = useRouter();
  const [prizes, setPrizes] = useState(initialPrizes);
  const [newPrize, setNewPrize] = useState({
    label: "",
    probability_weight: 10,
    stock_remaining: "",
  });

  const refresh = () => router.refresh();

  const addPrize = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("prizes")
      .insert({
        merchant_id: merchantId,
        label: newPrize.label,
        probability_weight: newPrize.probability_weight,
        stock_remaining: newPrize.stock_remaining
          ? parseInt(newPrize.stock_remaining, 10)
          : null,
      })
      .select()
      .single();

    if (!error && data) {
      setPrizes((p) => [...p, data as Prize]);
      setNewPrize({ label: "", probability_weight: 10, stock_remaining: "" });
      refresh();
    }
  };

  const toggleActive = async (prize: Prize) => {
    const supabase = createClient();
    await supabase.from("prizes").update({ active: !prize.active }).eq("id", prize.id);
    setPrizes((p) =>
      p.map((x) => (x.id === prize.id ? { ...x, active: !x.active } : x)),
    );
    refresh();
  };

  const deletePrize = async (id: string) => {
    const supabase = createClient();
    await supabase.from("prizes").delete().eq("id", id);
    setPrizes((p) => p.filter((x) => x.id !== id));
    refresh();
  };

  return (
    <div className="space-y-8">
      <div className={ui.card}>
        <h2 className={ui.h2}>Prix configurés</h2>
        {prizes.length === 0 ? (
          <p className={`mt-4 ${ui.muted}`}>Aucun prix pour le moment.</p>
        ) : (
          <div className="mt-5 divide-y divide-border border border-border">
            {prizes.map((prize) => (
              <div
                key={prize.id}
                className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{prize.label}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    poids {prize.probability_weight}
                    {prize.stock_remaining !== null && ` · stock ${prize.stock_remaining}`}
                    {!prize.active && " · inactif"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => toggleActive(prize)} className={ui.btnOutline}>
                    {prize.active ? "Désactiver" : "Activer"}
                  </button>
                  <button type="button" onClick={() => deletePrize(prize.id)} className={ui.btnDanger}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={ui.card}>
        <h2 className={ui.h2}>Ajouter un prix</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <label className={ui.label}>Libellé</label>
            <input
              value={newPrize.label}
              onChange={(e) => setNewPrize((p) => ({ ...p, label: e.target.value }))}
              className={ui.input}
            />
          </div>
          <div>
            <label className={ui.label}>Poids</label>
            <input
              type="number"
              value={newPrize.probability_weight}
              onChange={(e) =>
                setNewPrize((p) => ({ ...p, probability_weight: parseInt(e.target.value, 10) }))
              }
              className={ui.input}
            />
          </div>
          <div>
            <label className={ui.label}>Stock (vide = ∞)</label>
            <input
              value={newPrize.stock_remaining}
              onChange={(e) => setNewPrize((p) => ({ ...p, stock_remaining: e.target.value }))}
              className={ui.input}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={addPrize}
          disabled={!newPrize.label}
          className={`mt-5 ${ui.btn}`}
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}
