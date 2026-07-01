"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Prize } from "@/lib/types";
import { useRouter } from "next/navigation";

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
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold">Prix existants</h3>
        <div className="space-y-3">
          {prizes.map((prize) => (
            <div
              key={prize.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">{prize.label}</p>
                <p className="text-sm text-gray-500">
                  Poids: {prize.probability_weight}
                  {prize.stock_remaining !== null && ` · Stock: ${prize.stock_remaining}`}
                  {!prize.active && " · Inactif"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleActive(prize)}
                  className="rounded px-3 py-1 text-sm border"
                >
                  {prize.active ? "Désactiver" : "Activer"}
                </button>
                <button
                  type="button"
                  onClick={() => deletePrize(prize.id)}
                  className="rounded px-3 py-1 text-sm text-red-600 border border-red-200"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold">Ajouter un prix</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={newPrize.label}
            onChange={(e) => setNewPrize((p) => ({ ...p, label: e.target.value }))}
            placeholder="Label"
            className="rounded-lg border px-4 py-2"
          />
          <input
            type="number"
            value={newPrize.probability_weight}
            onChange={(e) =>
              setNewPrize((p) => ({ ...p, probability_weight: parseInt(e.target.value, 10) }))
            }
            placeholder="Poids"
            className="rounded-lg border px-4 py-2"
          />
          <input
            value={newPrize.stock_remaining}
            onChange={(e) => setNewPrize((p) => ({ ...p, stock_remaining: e.target.value }))}
            placeholder="Stock (vide = illimité)"
            className="rounded-lg border px-4 py-2"
          />
        </div>
        <button
          type="button"
          onClick={addPrize}
          disabled={!newPrize.label}
          className="mt-4 rounded-lg bg-orange-600 px-6 py-2 font-semibold text-white disabled:opacity-50"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}
