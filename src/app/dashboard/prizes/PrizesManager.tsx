"use client";

import { useMemo, useState } from "react";
import type { Prize, SocialLinks } from "@/lib/types";
import { useRouter } from "next/navigation";
import { ui } from "@/components/ui/styles";
import { useI18n } from "@/i18n/client";
import { formatMinSpendVnd, parseMinSpendInput } from "@/lib/redemption-rules";
import {
  emptyRedemptionForm,
  redemptionFormFromPrize,
  RedemptionRulesFields,
  type RedemptionFormState,
} from "./RedemptionRulesFields";
import { PRIZE_LABEL_MAX_LENGTH, clampPrizeLabel, prizeWinChancePercent } from "@/lib/wheel";
import {
  activeWinChanceIsValid,
  parseWinChancePercent,
  sanitizeWinChanceDraft,
  totalActiveWinChance,
  WIN_CHANCE_TARGET,
} from "@/lib/prize-chances";
import {
  defaultIconForMechanic,
  normalizeSocialUnlockPlatform,
  resolvePrizeMechanic,
  type PrizeMechanic,
  type SocialUnlockPlatform,
} from "@/lib/prize-mechanics";
import { Wheel } from "@/components/Wheel";
import { activeWheelPrizes } from "@/lib/prizes";
import { resolveJourneyTheme } from "@/lib/journey-theme";
import { PrizeIconPicker } from "@/components/dashboard/PrizeIconPicker";
import { PrizeMechanicSelect } from "@/components/dashboard/PrizeMechanicSelect";
import { SocialUnlockPlatformSelect } from "@/components/dashboard/SocialUnlockPlatformSelect";
import { DEFAULT_PRIZE_ICON, normalizePrizeIcon, type PrizeIconId } from "@/lib/prize-icons";

type PrizeForm = {
  label: string;
  icon: PrizeIconId;
  prize_mechanic: PrizeMechanic;
  social_unlock_platform: SocialUnlockPlatform | "";
  probability_weight: string;
  stock_remaining: string;
  redemption: RedemptionFormState;
};

const MECHANIC_DEFAULT_LABELS: Record<PrizeMechanic, string> = {
  standard: "",
  retry: "Try again",
  no_win: "No prize",
  near_miss: "Near miss",
  mystery: "Mystery prize",
  double_or_nothing: "Double or nothing",
  social_unlock: "Social unlock",
};

function applyMechanicToForm(form: PrizeForm, mechanic: PrizeMechanic): PrizeForm {
  const icon = defaultIconForMechanic(mechanic);
  const suggested = MECHANIC_DEFAULT_LABELS[mechanic];
  return {
    ...form,
    prize_mechanic: mechanic,
    icon,
    label: form.label.trim() ? form.label : suggested || form.label,
    social_unlock_platform: mechanic === "social_unlock" ? form.social_unlock_platform : "",
  };
}

function defaultChanceForNewPrize(prizes: Prize[]): string {
  const remaining = WIN_CHANCE_TARGET - totalActiveWinChance(prizes);
  if (remaining >= 1) return String(remaining);
  return "10";
}

function normalizeWinChance(value: number | string): number {
  const n = parseWinChancePercent(value);
  return n < 1 ? 1 : n;
}

function parseOptionalStock(raw: string): number | null {
  const stockRaw = raw.trim();
  if (!stockRaw) return null;
  const parsed = parseInt(stockRaw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function buildPrizePayload(form: PrizeForm) {
  const validDays = form.redemption.redeem_valid_days.trim()
    ? parseInt(form.redemption.redeem_valid_days, 10)
    : null;

  if (validDays !== null && (validDays < 1 || validDays > 365)) {
    throw new Error("invalid_valid_days");
  }

  const stockRaw = form.stock_remaining.trim();
  let stock_remaining: number | null = null;
  if (stockRaw) {
    const parsed = parseInt(stockRaw, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new Error("invalid_stock");
    }
    stock_remaining = parsed;
  }

  const label = clampPrizeLabel(form.label);
  if (!label) {
    throw new Error("empty_label");
  }

  if (form.prize_mechanic === "social_unlock" && !form.social_unlock_platform) {
    throw new Error("social_unlock_platform_required");
  }

  return {
    label,
    icon: normalizePrizeIcon(form.icon),
    prize_mechanic: form.prize_mechanic,
    social_unlock_platform:
      form.prize_mechanic === "social_unlock" ? form.social_unlock_platform : null,
    probability_weight: normalizeWinChance(form.probability_weight),
    stock_remaining,
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

function emptyPrizeForm(prizes: Prize[] = []): PrizeForm {
  return {
    label: "",
    icon: DEFAULT_PRIZE_ICON,
    prize_mechanic: "standard",
    social_unlock_platform: "",
    probability_weight: defaultChanceForNewPrize(prizes),
    stock_remaining: "",
    redemption: emptyRedemptionForm(),
  };
}

function prizeFormFromPrize(prize: Prize): PrizeForm {
  return {
    label: prize.label,
    icon: normalizePrizeIcon(prize.icon),
    prize_mechanic: resolvePrizeMechanic(prize),
    social_unlock_platform: normalizeSocialUnlockPlatform(prize.social_unlock_platform) ?? "",
    probability_weight: String(prize.probability_weight),
    stock_remaining: prize.stock_remaining !== null ? String(prize.stock_remaining) : "",
    redemption: redemptionFormFromPrize(prize),
  };
}

function mechanicLabelKey(mechanic: PrizeMechanic): string {
  return `dashboard.prizeMechanic_${mechanic}`;
}

function mapPrizeApiError(code: string | undefined, t: (key: string) => string): string {
  if (code === "prize_has_spins") return t("dashboard.prizeDeleteHasSpins");
  if (code === "win_chances_must_sum_100") return t("dashboard.winChancesMustSum100");
  if (code === "invalid_win_chance") return t("dashboard.winChanceInvalid");
  if (code === "social_unlock_platform_required") return t("dashboard.socialUnlockPlatformRequired");
  if (code === "social_unlock_url_missing") return t("dashboard.socialUnlockUrlMissingSave");
  if (code === "empty_label" || code === "invalid_valid_days" || code === "invalid_stock") {
    if (code === "invalid_valid_days") return t("dashboard.redeemValidDaysInvalid");
    if (code === "invalid_stock") return t("dashboard.prizeStockInvalid");
    return t("dashboard.prizeSaveFailed");
  }
  return code ?? t("dashboard.prizeSaveFailed");
}

export function PrizesManager({
  merchantId,
  initialPrizes,
  primaryColor,
  secondaryColor,
  journeyTheme,
  socialLinks,
}: {
  merchantId: string;
  initialPrizes: Prize[];
  primaryColor: string;
  secondaryColor: string;
  journeyTheme: Record<string, unknown> | null;
  socialLinks: SocialLinks;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [prizes, setPrizes] = useState(initialPrizes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PrizeForm>(emptyPrizeForm(initialPrizes));
  const [newPrize, setNewPrize] = useState<PrizeForm>(emptyPrizeForm(initialPrizes));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [previewWonLabel, setPreviewWonLabel] = useState<string | null>(null);

  const theme = useMemo(
    () =>
      resolveJourneyTheme({
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        journey_theme: journeyTheme,
      } as import("@/lib/types").Merchant),
    [primaryColor, secondaryColor, journeyTheme],
  );

  const draftPrizes = useMemo(() => {
    let next = prizes.map((prize) => {
      if (prize.id !== editingId) return prize;
      const label = clampPrizeLabel(editForm.label) || prize.label;
      return {
        ...prize,
        label,
        icon: editForm.icon,
        prize_mechanic: editForm.prize_mechanic,
        social_unlock_platform:
          editForm.prize_mechanic === "social_unlock" ? editForm.social_unlock_platform || null : null,
        probability_weight: normalizeWinChance(editForm.probability_weight),
        stock_remaining: parseOptionalStock(editForm.stock_remaining),
      };
    });

    const draftLabel = clampPrizeLabel(newPrize.label);
    if (draftLabel) {
      next = [
        ...next,
        {
          id: "__preview_draft__",
          merchant_id: merchantId,
          label: draftLabel,
          icon: newPrize.icon,
          prize_mechanic: newPrize.prize_mechanic,
          social_unlock_platform:
            newPrize.prize_mechanic === "social_unlock"
              ? newPrize.social_unlock_platform || null
              : null,
          probability_weight: normalizeWinChance(newPrize.probability_weight),
          stock_remaining: parseOptionalStock(newPrize.stock_remaining),
          active: true,
          created_at: new Date(0).toISOString(),
        },
      ];
    }

    return next;
  }, [prizes, editingId, editForm, newPrize, merchantId]);

  const previewPrizes = useMemo(() => activeWheelPrizes(draftPrizes), [draftPrizes]);
  const hiddenInactiveCount = draftPrizes.length - previewPrizes.length;

  const activeChanceTotal = useMemo(() => totalActiveWinChance(prizes), [prizes]);
  const chancesValid = useMemo(() => activeWinChanceIsValid(prizes), [prizes]);

  const splitChancesEvenly = async () => {
    const active = prizes.filter((p) => p.active);
    if (active.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/prizes/equalize-chances", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { prizes?: Prize[]; error?: string };
      if (!res.ok) {
        setError(mapPrizeApiError(data.error, t));
        return;
      }
      const updated = data.prizes ?? [];
      const byId = new Map(updated.map((p) => [p.id, p]));
      setPrizes((prev) => prev.map((p) => byId.get(p.id) ?? p));
      if (editingId) {
        const edited = byId.get(editingId);
        if (edited) {
          setEditForm((f) => ({ ...f, probability_weight: String(edited.probability_weight) }));
        }
      }
      setNewPrize((p) => ({
        ...p,
        probability_weight: defaultChanceForNewPrize(
          prizes.map((prize) => byId.get(prize.id) ?? prize),
        ),
      }));
      refresh();
    } catch {
      setError(t("dashboard.prizeSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const refresh = () => router.refresh();

  const startEdit = (prize: Prize) => {
    setEditingId(prize.id);
    setEditForm(prizeFormFromPrize(prize));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const updatePrizeIcon = async (prize: Prize, icon: PrizeIconId) => {
    setSaving(true);
    setError(null);

    const redemption = redemptionFormFromPrize(prize);
    const apiRes = await fetch("/api/dashboard/prizes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: prize.id,
        label: prize.label,
        icon,
        prize_mechanic: resolvePrizeMechanic(prize),
        social_unlock_platform: normalizeSocialUnlockPlatform(prize.social_unlock_platform),
        probability_weight: prize.probability_weight,
        stock_remaining: prize.stock_remaining,
        redeem_next_visit: prize.redeem_next_visit,
        redeem_min_spend: redemption.redeem_min_spend,
        redeem_valid_days: prize.redeem_valid_days,
      }),
    });

    if (!apiRes.ok) {
      const errBody = (await apiRes.json().catch(() => ({}))) as { error?: string };
      setError(mapPrizeApiError(errBody.error, t));
      setSaving(false);
      return;
    }

    const apiData = (await apiRes.json()) as { prize?: Prize };
    if (apiData.prize) {
      setPrizes((p) => p.map((x) => (x.id === prize.id ? apiData.prize! : x)));
      refresh();
    }
    setSaving(false);
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    setError(null);
    let payload;
    try {
      payload = buildPrizePayload(editForm);
    } catch (e) {
      setSaving(false);
      if (e instanceof Error && e.message === "invalid_valid_days") {
        setError(t("dashboard.redeemValidDaysInvalid"));
      } else if (e instanceof Error && e.message === "invalid_stock") {
        setError(t("dashboard.prizeStockInvalid"));
      } else if (e instanceof Error && e.message === "social_unlock_platform_required") {
        setError(t("dashboard.socialUnlockPlatformRequired"));
      } else {
        setError(t("dashboard.prizeSaveFailed"));
      }
      return;
    }

    const apiRes = await fetch("/api/dashboard/prizes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        label: payload.label,
        icon: payload.icon,
        prize_mechanic: payload.prize_mechanic,
        social_unlock_platform: payload.social_unlock_platform,
        probability_weight: payload.probability_weight,
        stock_remaining: payload.stock_remaining,
        redeem_next_visit: payload.redeem_next_visit,
        redeem_min_spend: editForm.redemption.redeem_min_spend,
        redeem_valid_days: payload.redeem_valid_days,
      }),
    });

    if (!apiRes.ok) {
      const errBody = (await apiRes.json().catch(() => ({}))) as { error?: string };
      setError(mapPrizeApiError(errBody.error, t));
      setSaving(false);
      return;
    }

    const apiData = (await apiRes.json()) as { prize?: Prize };
    if (apiData.prize) {
      setPrizes((p) => p.map((x) => (x.id === id ? apiData.prize! : x)));
      setEditingId(null);
      refresh();
    }
    setSaving(false);
  };

  const addPrize = async () => {
    setSaving(true);
    setError(null);
    let payload;
    try {
      payload = buildPrizePayload(newPrize);
    } catch (e) {
      setSaving(false);
      if (e instanceof Error && e.message === "invalid_valid_days") {
        setError(t("dashboard.redeemValidDaysInvalid"));
      } else if (e instanceof Error && e.message === "invalid_stock") {
        setError(t("dashboard.prizeStockInvalid"));
      } else if (e instanceof Error && e.message === "social_unlock_platform_required") {
        setError(t("dashboard.socialUnlockPlatformRequired"));
      } else {
        setError(t("dashboard.prizeSaveFailed"));
      }
      return;
    }
    const apiRes = await fetch("/api/dashboard/prizes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: payload.label,
        icon: payload.icon,
        prize_mechanic: payload.prize_mechanic,
        social_unlock_platform: payload.social_unlock_platform,
        probability_weight: payload.probability_weight,
        stock_remaining: payload.stock_remaining,
        redeem_next_visit: payload.redeem_next_visit,
        redeem_min_spend: newPrize.redemption.redeem_min_spend,
        redeem_valid_days: payload.redeem_valid_days,
      }),
    });

    if (!apiRes.ok) {
      const errBody = (await apiRes.json().catch(() => ({}))) as { error?: string };
      setError(mapPrizeApiError(errBody.error, t));
      setSaving(false);
      return;
    }

    const apiData = (await apiRes.json()) as { prize?: Prize };
    if (apiData.prize) {
      setPrizes((p) => [...p, apiData.prize!]);
      setNewPrize(emptyPrizeForm([...prizes, apiData.prize!]));
      refresh();
    }
    setSaving(false);
  };

  const toggleActive = async (prize: Prize) => {
    setError(null);
    const apiRes = await fetch("/api/dashboard/prizes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: prize.id, active: !prize.active }),
    });

    if (!apiRes.ok) {
      const errBody = (await apiRes.json().catch(() => ({}))) as { error?: string };
      setError(mapPrizeApiError(errBody.error, t));
      return;
    }

    const apiData = (await apiRes.json()) as { prize?: Prize };
    if (apiData.prize) {
      setPrizes((p) => p.map((x) => (x.id === prize.id ? apiData.prize! : x)));
    } else {
      setPrizes((p) => p.map((x) => (x.id === prize.id ? { ...x, active: !x.active } : x)));
    }
    refresh();
  };

  const deletePrize = async (id: string) => {
    setError(null);
    const apiRes = await fetch(`/api/dashboard/prizes?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (!apiRes.ok) {
      const errBody = (await apiRes.json().catch(() => ({}))) as { error?: string };
      setError(mapPrizeApiError(errBody.error, t));
      return;
    }

    setPrizes((p) => p.filter((x) => x.id !== id));
    if (editingId === id) setEditingId(null);
    refresh();
  };

  const ruleSummary = (prize: Prize) => {
    const parts: string[] = [];
    if (prize.redeem_next_visit) parts.push(t("dashboard.redeemNextVisitShort"));
    if (prize.redeem_min_spend_cents && prize.redeem_min_spend_cents > 0) {
      parts.push(
        t("dashboard.redeemMinSpendShort", {
          amount: formatMinSpendVnd(prize.redeem_min_spend_cents, locale),
        }),
      );
    }
    if (prize.redeem_valid_days && prize.redeem_valid_days > 0) {
      parts.push(t("dashboard.redeemValidDaysShort", { days: prize.redeem_valid_days }));
    }
    return parts.length > 0 ? parts.join(" · ") : t("dashboard.redeemNoRules");
  };

  const prizeListCard = (
    <div className={ui.card}>
      <h2 className={ui.h2}>{t("dashboard.prizesConfigured")}</h2>
      {prizes.some((p) => p.active) && (
        <div
          className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border-2 px-4 py-3 ${
            chancesValid ? "border-black/15 bg-white" : "border-[var(--c-coral,#f87171)] bg-[#fff5f5]"
          }`}
        >
          <p className="text-sm font-semibold text-ink">
            {t("dashboard.winChanceTotal", {
              total: activeChanceTotal,
              target: WIN_CHANCE_TARGET,
            })}
          </p>
          <button
            type="button"
            onClick={() => void splitChancesEvenly()}
            disabled={saving}
            className={ui.btnOutline}
          >
            {t("dashboard.splitWinChancesEvenly")}
          </button>
        </div>
      )}
      {!chancesValid && prizes.some((p) => p.active) && (
        <p className="mt-2 text-sm font-semibold text-[var(--c-coral,#dc2626)]">
          {t("dashboard.winChancesMustSum100")}
        </p>
      )}
      {prizes.length === 0 ? (
        <p className={`mt-4 ${ui.muted}`}>{t("dashboard.noPrizes")}</p>
      ) : (
        <div className="mt-5 rounded-[14px] border-2 border-black">
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
                        <label className={ui.label}>{t("dashboard.winChance")}</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={editForm.probability_weight}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                probability_weight: sanitizeWinChanceDraft(e.target.value),
                              }))
                            }
                            className={`${ui.input} pr-10`}
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-bold text-muted">
                            %
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-muted">{t("dashboard.winChanceHint")}</p>
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
                    <div>
                      <label className={ui.label}>{t("dashboard.prizeMechanic")}</label>
                      <PrizeMechanicSelect
                        value={editForm.prize_mechanic}
                        onChange={(mechanic) =>
                          setEditForm((f) => applyMechanicToForm(f, mechanic))
                        }
                        disabled={saving}
                      />
                    </div>
                    {editForm.prize_mechanic === "social_unlock" && (
                      <div className="max-w-md">
                        <label className={ui.label}>{t("dashboard.socialUnlockPlatform")}</label>
                        <div className="mt-2">
                          <SocialUnlockPlatformSelect
                            value={editForm.social_unlock_platform}
                            onChange={(platform) =>
                              setEditForm((f) => ({ ...f, social_unlock_platform: platform }))
                            }
                            socialLinks={socialLinks}
                            disabled={saving}
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className={ui.label}>{t("dashboard.prizeIcon")}</label>
                      <div className="mt-2 max-w-md">
                        <PrizeIconPicker
                          value={editForm.icon}
                          onChange={(icon) => setEditForm((f) => ({ ...f, icon }))}
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
                    <div className="flex min-w-0 items-start gap-3">
                      <PrizeIconPicker
                        variant="compact"
                        value={normalizePrizeIcon(prize.icon)}
                        disabled={saving}
                        onChange={(icon) => updatePrizeIcon(prize, icon)}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">{prize.label}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted">
                          {(() => {
                            const pct = prizeWinChancePercent(prize, prizes);
                            return pct != null
                              ? t("dashboard.winChanceSummary", { pct })
                              : t("dashboard.winChanceInactive");
                          })()}
                          {prize.stock_remaining !== null && ` · ${t("common.stock")} ${prize.stock_remaining}`}
                          {!prize.active && ` · ${t("common.inactive")}`}
                          {prize.prize_mechanic && resolvePrizeMechanic(prize) !== "standard" && (
                            <> · {t(mechanicLabelKey(resolvePrizeMechanic(prize)))}</>
                          )}
                        </p>
                        <p className="mt-1 text-xs font-medium text-muted">{ruleSummary(prize)}</p>
                      </div>
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
  );

  const previewCard = (
    <section className={`${ui.card} lg:sticky lg:top-6`}>
      <h2 className={ui.h2}>{t("dashboard.prizeWheelPreviewTitle")}</h2>
      <p className={`mt-2 ${ui.muted}`}>{t("dashboard.prizeWheelPreviewHint")}</p>

      <div className="mt-5 flex flex-col items-center gap-4">
        {previewPrizes.length === 0 ? (
          <p className="py-8 text-center text-sm font-semibold text-muted">
            {t("dashboard.prizeWheelPreviewEmpty")}
          </p>
        ) : (
          <Wheel
            prizes={previewPrizes}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            colors={theme.wheel}
            spinning={spinning}
            setSpinning={setSpinning}
            sizePx={280}
            spinButtonLabel={t("dashboard.prizeWheelPreviewSpin")}
            spinningLabel={t("public.wheelSpinning")}
            onSpinComplete={(prize) => {
              setPreviewWonLabel(prize.label);
            }}
          />
        )}

        {previewWonLabel && (
          <p className={`${ui.alertSuccess} w-full text-center`}>
            {t("dashboard.prizeWheelPreviewWon", { label: previewWonLabel })}
          </p>
        )}

        {hiddenInactiveCount > 0 && (
          <p className="text-center text-xs font-medium text-muted">
            {t("dashboard.prizeWheelPreviewHiddenInactive", { count: hiddenInactiveCount })}
          </p>
        )}
      </div>
    </section>
  );

  return (
    <div className="space-y-8">
      {error && <p className={ui.alertError}>{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
        <div className="order-2 space-y-8 lg:order-1">
          {prizeListCard}

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
                <label className={ui.label}>{t("dashboard.winChance")}</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={newPrize.probability_weight}
                    onChange={(e) =>
                      setNewPrize((p) => ({
                        ...p,
                        probability_weight: sanitizeWinChanceDraft(e.target.value),
                      }))
                    }
                    className={`${ui.input} pr-10`}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-bold text-muted">
                    %
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-muted">{t("dashboard.winChanceHint")}</p>
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
            <div className="max-w-md">
              <label className={ui.label}>{t("dashboard.prizeMechanic")}</label>
              <PrizeMechanicSelect
                value={newPrize.prize_mechanic}
                onChange={(mechanic) => setNewPrize((p) => applyMechanicToForm(p, mechanic))}
                disabled={saving}
              />
            </div>
            {newPrize.prize_mechanic === "social_unlock" && (
              <div className="mt-4 max-w-md">
                <label className={ui.label}>{t("dashboard.socialUnlockPlatform")}</label>
                <div className="mt-2">
                  <SocialUnlockPlatformSelect
                    value={newPrize.social_unlock_platform}
                    onChange={(platform) =>
                      setNewPrize((p) => ({ ...p, social_unlock_platform: platform }))
                    }
                    socialLinks={socialLinks}
                    disabled={saving}
                  />
                </div>
              </div>
            )}
            <div className="mt-4 max-w-md">
              <label className={ui.label}>{t("dashboard.prizeIcon")}</label>
              <div className="mt-2">
                <PrizeIconPicker
                  value={newPrize.icon}
                  onChange={(icon) => setNewPrize((p) => ({ ...p, icon }))}
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

        <div className="order-1 lg:order-2">{previewCard}</div>
      </div>
    </div>
  );
}
