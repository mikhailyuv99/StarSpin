"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Prize } from "@/lib/types";
import { useRouter } from "next/navigation";
import { ui } from "@/components/ui/styles";

type EditForm = {
  label: string;
  probability_weight: number;
  stock_remaining: string;
};

export function PrizesManager({
  merchantId,
  initialPrizes,
}: {
  merchantId: string;
  initialPrizes: Prize[];
}) {
  const router = useRouter();
  const [prizes, setPrizes] = useState(initialPrizes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    label: "",
    probability_weight: 10,
    stock_remaining: "",
  });
  const [newPrize, setNewPrize] = useState({
    label: "",
    probability_weight: 10,
    stock_remaining: "",
  });
  const [saving, setSaving] = useState(false);

  const refresh = () => router.refresh();

  const startEdit = (prize: Prize) => {
    setEditingId(prize.id);
    setEditForm({
      label: prize.label,
      probability_weight: prize.probability_weight,
      stock_remaining:
        prize.stock_remaining !== null ? String(prize.stock_remaining) : "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      label: editForm.label.trim(),
      probability_weight: editForm.probability_weight,
      stock_remaining: editForm.stock_remaining
        ? parseInt(editForm.stock_remaining, 10)
        : null,
    };
    const { data, error } = await supabase
      .from("prizes")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      setPrizes((p) => p.map((x) => (x.id === id ? (data as Prize) : x)));
      setEditingId(null);
      refresh();
    }
    setSaving(false);
  };

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
    if (editingId === id) setEditingId(null);
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
              <div key={prize.id} className="bg-white px-4 py-4">
                {editingId === prize.id ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className={ui.label}>Libellé</label>
                        <input
                          value={editForm.label}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, label: e.target.value }))
                          }
                          className={ui.input}
                        />
                      </div>
                      <div>
                        <label className={ui.label}>Poids</label>
                        <input
                          type="number"
                          min={1}
                          value={editForm.probability_weight}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              probability_weight: parseInt(e.target.value, 10) || 1,
                            }))
                          }
                          className={ui.input}
                        />
                      </div>
                      <div>
                        <label className={ui.label}>Stock (vide = ∞)</label>
                        <input
                          value={editForm.stock_remaining}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, stock_remaining: e.target.value }))
                          }
                          className={ui.input}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => saveEdit(prize.id)}
                        disabled={saving || !editForm.label.trim()}
                        className={ui.btn}
                      >
                        {saving ? "Enregistrement…" : "Enregistrer"}
                      </button>
                      <button type="button" onClick={cancelEdit} className={ui.btnOutline}>
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{prize.label}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted">
                        poids {prize.probability_weight}
                        {prize.stock_remaining !== null && ` · stock ${prize.stock_remaining}`}
                        {!prize.active && " · inactif"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => startEdit(prize)} className={ui.btnOutline}>
                        Modifier
                      </button>
                      <button type="button" onClick={() => toggleActive(prize)} className={ui.btnOutline}>
                        {prize.active ? "Désactiver" : "Activer"}
                      </button>
                      <button type="button" onClick={() => deletePrize(prize.id)} className={ui.btnDanger}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
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
