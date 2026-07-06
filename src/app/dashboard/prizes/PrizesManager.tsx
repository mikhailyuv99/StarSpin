"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Prize } from "@/lib/types";
import { useRouter } from "next/navigation";
import { ui } from "@/components/ui/styles";
import { useTranslations } from "@/i18n/client";
import { parseMinSpendInput } from "@/lib/redemption-rules";
import {
  emptyRedemptionForm,
  redemptionFormFromPrize,
  RedemptionRulesFields,
  type RedemptionFormState,
} from "./RedemptionRulesFields";
import { PRIZE_LABEL_MAX_LENGTH, clampPrizeLabel } from "@/lib/wheel";

type PrizeForm = {
  label: string;
  probability_weight: number;
  stock_remaining: string;
  redemption: RedemptionFormState;
};

function normalizeWeight(value: number): number {
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.floor(value);
}

function buildPrizePayload(form: PrizeForm) {
  const validDays = form.redemption.redeem_valid_days.trim()
    ? parseInt(form.redemption.redeem_valid_days, 10)
    : null;

  if (validDays !== null && (validDays < 1 || validDays > 365)) {
    throw new Error("invalid_valid_days");
  }

  const label = clampPrizeLabel(form.label);
  if (!label) {
    throw new Error("empty_label");
  }

  return {
    label,
    probability_weight: normalizeWeight(form.probability_weight),
    stock_remaining: form.stock_remaining ? parseInt(form.stock_remaining, 10) : null,
    ...buildRedemptionPayload(form.redemption),
  };
}

function buildRedemptionPayload(redemption: RedemptionFormState) {
  const validDays = redemption.redeem_valid_days.trim()
    ? parseInt(redemption.redeem_valid_days, 10)
    : null;

  return {
    redeem_next_visit: redemption.redeem_next_visit,
    redeem_min_spend_cents: parseMinSpendInput(redemption.redeem_min_spend),
    redeem_valid_days: validDays && validDays > 0 ? validDays : null,
  };
}

function emptyPrizeForm(): PrizeForm {
  return {
    label: "",
    probability_weight: 10,
    stock_remaining: "",
    redemption: emptyRedemptionForm(),
  };
}

export function PrizesManager({
  merchantId,
  initialPrizes,
}: {
  merchantId: string;
  initialPrizes: Prize[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [prizes, setPrizes] = useState(initialPrizes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PrizeForm>(emptyPrizeForm());
  const [newPrize, setNewPrize] = useState<PrizeForm>(emptyPrizeForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => router.refresh();

  const startEdit = (prize: Prize) => {
    setEditingId(prize.id);
    setEditForm({
      label: prize.label,
      probability_weight: prize.probability_weight,
      stock_remaining: prize.stock_remaining !== null ? String(prize.stock_remaining) : "",
      redemption: redemptionFormFromPrize(prize),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    let payload;
    try {
      payload = buildPrizePayload(editForm);
    } catch (e) {
      setSaving(false);
      if (e instanceof Error && e.message === "invalid_valid_days") {
        setError(t("dashboard.redeemValidDaysInvalid"));
      } else {
        setError(t("dashboard.prizeSaveFailed"));
      }
      return;
    }
    const { data, error: saveError } = await supabase.from("prizes").update(payload).eq("id", id).select().single();

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }
    if (data) {
      setPrizes((p) => p.map((x) => (x.id === id ? (data as Prize) : x)));
      setEditingId(null);
      refresh();
    }
    setSaving(false);
  };

  const addPrize = async () => {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    let payload;
    try {
      payload = buildPrizePayload(newPrize);
    } catch (e) {
      setSaving(false);
      if (e instanceof Error && e.message === "invalid_valid_days") {
        setError(t("dashboard.redeemValidDaysInvalid"));
      } else {
        setError(t("dashboard.prizeSaveFailed"));
      }
      return;
    }
    const { data, error: insertError } = await supabase
      .from("prizes")
      .insert({
        merchant_id: merchantId,
        ...payload,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }
    if (data) {
      setPrizes((p) => [...p, data as Prize]);
      setNewPrize(emptyPrizeForm());
      refresh();
    }
    setSaving(false);
  };

  const toggleActive = async (prize: Prize) => {
    const supabase = createClient();
    await supabase.from("prizes").update({ active: !prize.active }).eq("id", prize.id);
    setPrizes((p) => p.map((x) => (x.id === prize.id ? { ...x, active: !x.active } : x)));
    refresh();
  };

  const deletePrize = async (id: string) => {
    const supabase = createClient();
    await supabase.from("prizes").delete().eq("id", id);
    setPrizes((p) => p.filter((x) => x.id !== id));
    if (editingId === id) setEditingId(null);
    refresh();
  };

  const ruleSummary = (prize: Prize) => {
    const parts: string[] = [];
    if (prize.redeem_next_visit) parts.push(t("dashboard.redeemNextVisitShort"));
    if (prize.redeem_min_spend_cents && prize.redeem_min_spend_cents > 0) {
      parts.push(t("dashboard.redeemMinSpendShort", { amount: prize.redeem_min_spend_cents / 100 }));
    }
    if (prize.redeem_valid_days && prize.redeem_valid_days > 0) {
      parts.push(t("dashboard.redeemValidDaysShort", { days: prize.redeem_valid_days }));
    }
    return parts.length > 0 ? parts.join(" · ") : t("dashboard.redeemNoRules");
  };

  return (
    <div className="space-y-8">
      {error && <p className={ui.alertError}>{error}</p>}
      <div className={ui.card}>
        <h2 className={ui.h2}>{t("dashboard.prizesConfigured")}</h2>
        {prizes.length === 0 ? (
          <p className={`mt-4 ${ui.muted}`}>{t("dashboard.noPrizes")}</p>
        ) : (
          <div className="mt-5 overflow-hidden rounded-[14px] border-2 border-black">
            {prizes.map((prize) => (
              <div key={prize.id} className="border-b-2 border-black/10 bg-white px-4 py-4 last:border-b-0">
                {editingId === prize.id ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className={ui.label}>{t("dashboard.label")}</label>
                        <input
                          value={editForm.label}
                          maxLength={PRIZE_LABEL_MAX_LENGTH}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              label: e.target.value.slice(0, PRIZE_LABEL_MAX_LENGTH),
                            }))
                          }
                          className={ui.input}
                        />
                        <p className="mt-1 text-xs font-medium text-muted">
                          {t("dashboard.prizeLabelHint", { max: PRIZE_LABEL_MAX_LENGTH })}
                        </p>
                      </div>
                      <div>
                        <label className={ui.label}>{t("dashboard.weight")}</label>
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
                        <label className={ui.label}>{t("dashboard.stockOptional")}</label>
                        <input
                          value={editForm.stock_remaining}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, stock_remaining: e.target.value }))
                          }
                          className={ui.input}
                        />
                      </div>
                    </div>
                    <RedemptionRulesFields
                      value={editForm.redemption}
                      onChange={(redemption) => setEditForm((f) => ({ ...f, redemption }))}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => saveEdit(prize.id)}
                        disabled={saving || !editForm.label.trim()}
                        className={ui.btn}
                      >
                        {saving ? t("common.saving") : t("common.save")}
                      </button>
                      <button type="button" onClick={cancelEdit} className={ui.btnOutline}>
                        {t("common.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{prize.label}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted">
                        {t("common.weight")} {prize.probability_weight}
                        {prize.stock_remaining !== null && ` · ${t("common.stock")} ${prize.stock_remaining}`}
                        {!prize.active && ` · ${t("common.inactive")}`}
                      </p>
                      <p className="mt-1 text-xs font-medium text-muted">{ruleSummary(prize)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => startEdit(prize)} className={ui.btnOutline}>
                        {t("common.edit")}
                      </button>
                      <button type="button" onClick={() => toggleActive(prize)} className={ui.btnOutline}>
                        {prize.active ? t("common.deactivate") : t("common.activate")}
                      </button>
                      <button type="button" onClick={() => deletePrize(prize.id)} className={ui.btnDanger}>
                        {t("common.delete")}
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
        <h2 className={ui.h2}>{t("dashboard.addPrize")}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <label className={ui.label}>{t("dashboard.label")}</label>
            <input
              value={newPrize.label}
              maxLength={PRIZE_LABEL_MAX_LENGTH}
              onChange={(e) =>
                setNewPrize((p) => ({
                  ...p,
                  label: e.target.value.slice(0, PRIZE_LABEL_MAX_LENGTH),
                }))
              }
              className={ui.input}
            />
            <p className="mt-1 text-xs font-medium text-muted">
              {t("dashboard.prizeLabelHint", { max: PRIZE_LABEL_MAX_LENGTH })}
            </p>
          </div>
          <div>
            <label className={ui.label}>{t("dashboard.weight")}</label>
            <input
              type="number"
              value={newPrize.probability_weight}
              onChange={(e) =>
                setNewPrize((p) => ({
                  ...p,
                  probability_weight: normalizeWeight(parseInt(e.target.value, 10)),
                }))
              }
              className={ui.input}
            />
          </div>
          <div>
            <label className={ui.label}>{t("dashboard.stockOptional")}</label>
            <input
              value={newPrize.stock_remaining}
              onChange={(e) => setNewPrize((p) => ({ ...p, stock_remaining: e.target.value }))}
              className={ui.input}
            />
          </div>
        </div>
        <div className="mt-4">
          <RedemptionRulesFields
            value={newPrize.redemption}
            onChange={(redemption) => setNewPrize((p) => ({ ...p, redemption }))}
          />
        </div>
        <button
          type="button"
          onClick={addPrize}
          disabled={saving || !newPrize.label.trim()}
          className={`mt-5 ${ui.btn}`}
        >
          {saving ? t("common.saving") : t("common.add")}
        </button>
      </div>
    </div>
  );
}
