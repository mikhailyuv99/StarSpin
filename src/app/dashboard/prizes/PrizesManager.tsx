"use client";

import { useMemo, useRef, useState } from "react";
import type { Prize, SocialLinks } from "@/lib/types";
import { ui } from "@/components/ui/styles";
import { useI18n } from "@/i18n/client";
import { formatMinSpendAmount, parseMinSpendInput, defaultRedeemCurrency, normalizeRedeemCurrency, type RedeemCurrency } from "@/lib/redemption-rules";
import { usePricingMarket } from "@/components/providers/PricingMarketProvider";
import {
 emptyRedemptionForm,
 redemptionFormFromPrize,
 RedemptionRulesFields,
 type RedemptionFormState,
} from "./RedemptionRulesFields";
import { PRIZE_LABEL_MAX_LENGTH, clampPrizeLabel, prizeWinChancePercent } from "@/lib/wheel";
import {
 activeWinChanceIsValid,
 equalWinChances,
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
import { activeWheelPrizes, hasMinimumWheelPrizes, MIN_WHEEL_PRIZES } from "@/lib/prizes";
import { resolveJourneyTheme } from "@/lib/journey-theme";
import { PrizeIconPicker } from "@/components/dashboard/PrizeIconPicker";
import { PrizeMechanicSelect } from "@/components/dashboard/PrizeMechanicSelect";
import { SocialUnlockPlatformSelect } from "@/components/dashboard/SocialUnlockPlatformSelect";
import { DEFAULT_PRIZE_ICON, normalizePrizeIcon, type PrizeIconId } from "@/lib/prize-icons";
import {
 applyTierWinChances,
 closestTierForPercent,
 normalizePrizeOddsMode,
 normalizeRarityTier,
 previewWinChanceForTier,
 type PrizeOddsMode,
 type PrizeRarityTier,
} from "@/lib/prize-rarity";
import { PrizeRarityBadge, PrizeRaritySelect } from "@/components/dashboard/PrizeRaritySelect";

type PrizeForm = {
 label: string;
 icon: PrizeIconId;
 prize_mechanic: PrizeMechanic;
 social_unlock_platform: SocialUnlockPlatform | "";
 rarity_tier: PrizeRarityTier;
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
 rarity_tier: form.rarity_tier,
 probability_weight: normalizeWinChance(form.probability_weight),
 stock_remaining,
 ...buildRedemptionPayload(form.redemption),
 };
}

function buildRedemptionPayload(redemption: RedemptionFormState) {
 const validDays = redemption.redeem_valid_days.trim()
 ? parseInt(redemption.redeem_valid_days, 10)
 : null;
 const minSpend = parseMinSpendInput(redemption.redeem_min_spend);

 return {
 redeem_next_visit: redemption.redeem_next_visit,
 redeem_min_spend_cents: minSpend,
 redeem_min_spend_currency: minSpend != null ? redemption.redeem_min_spend_currency : null,
 redeem_valid_days: validDays && validDays > 0 ? validDays : null,
 };
}

function emptyPrizeForm(prizes: Prize[] = [], currency: RedeemCurrency = "VND"): PrizeForm {
 return {
 label: "",
 icon: DEFAULT_PRIZE_ICON,
 prize_mechanic: "standard",
 social_unlock_platform: "",
 rarity_tier: "common",
 probability_weight: defaultChanceForNewPrize(prizes),
 stock_remaining: "",
 redemption: emptyRedemptionForm(currency),
 };
}

function prizeFormFromPrize(prize: Prize, fallbackCurrency: RedeemCurrency = "VND"): PrizeForm {
 return {
 label: prize.label,
 icon: normalizePrizeIcon(prize.icon),
 prize_mechanic: resolvePrizeMechanic(prize),
 social_unlock_platform: normalizeSocialUnlockPlatform(prize.social_unlock_platform) ?? "",
 rarity_tier: normalizeRarityTier(prize.rarity_tier),
 probability_weight: String(prize.probability_weight),
 stock_remaining: prize.stock_remaining !== null ? String(prize.stock_remaining) : "",
 redemption: redemptionFormFromPrize(prize, fallbackCurrency),
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
 if (code === "min_wheel_prizes") return t("dashboard.minWheelPrizes");
 if (code === "invalid_order") return t("dashboard.prizeReorderFailed");
 if (code === "empty_label" || code === "invalid_valid_days" || code === "invalid_stock") {
 if (code === "invalid_valid_days") return t("dashboard.redeemValidDaysInvalid");
 if (code === "invalid_stock") return t("dashboard.prizeStockInvalid");
 return t("dashboard.prizeSaveFailed");
 }
 return code ?? t("dashboard.prizeSaveFailed");
}

/** Merge API prizes into local list without reordering existing rows. */
function mergePrizesPreservingOrder(prev: Prize[], incoming: Prize[]): Prize[] {
 const byId = new Map(incoming.map((p) => [p.id, p]));
 const merged: Prize[] = [];
 for (const p of prev) {
 const updated = byId.get(p.id);
 if (updated) merged.push(updated);
 }
 const prevIds = new Set(prev.map((p) => p.id));
 for (const p of incoming) {
 if (!prevIds.has(p.id)) merged.push(p);
 }
 return merged;
}

function mergePrizesFromApi(
 prev: Prize[],
 data: { prize?: Prize; prizes?: Prize[] },
): Prize[] {
 if (data.prizes?.length) return mergePrizesPreservingOrder(prev, data.prizes);
 if (data.prize) return prev.map((p) => (p.id === data.prize!.id ? data.prize! : p));
 return prev;
}

function buildOptimisticPrize(prize: Prize, payload: ReturnType<typeof buildPrizePayload>): Prize {
 return {
 ...prize,
 label: payload.label,
 icon: payload.icon,
 prize_mechanic: payload.prize_mechanic,
 social_unlock_platform: payload.social_unlock_platform,
 rarity_tier: payload.rarity_tier,
 probability_weight: payload.probability_weight,
 stock_remaining: payload.stock_remaining,
 redeem_next_visit: payload.redeem_next_visit,
 redeem_min_spend_cents: payload.redeem_min_spend_cents,
 redeem_min_spend_currency: payload.redeem_min_spend_currency,
 redeem_valid_days: payload.redeem_valid_days,
 };
}

export function PrizesManager({
 merchantId,
 initialPrizes,
 initialOddsMode,
 primaryColor,
 secondaryColor,
 journeyTheme,
 socialLinks,
}: {
 merchantId: string;
 initialPrizes: Prize[];
 initialOddsMode?: string | null;
 primaryColor: string;
 secondaryColor: string;
 journeyTheme: Record<string, unknown> | null;
 socialLinks: SocialLinks;
}) {
 const { t, locale } = useI18n();
 const market = usePricingMarket();
 const defaultCurrency = defaultRedeemCurrency(market);
 const [prizes, setPrizes] = useState(initialPrizes);
 const [oddsMode, setOddsMode] = useState<PrizeOddsMode>(normalizePrizeOddsMode(initialOddsMode));
 const [editingId, setEditingId] = useState<string | null>(null);
 const [editForm, setEditForm] = useState<PrizeForm>(() => emptyPrizeForm(initialPrizes, defaultCurrency));
 const [newPrize, setNewPrize] = useState<PrizeForm>(() => emptyPrizeForm(initialPrizes, defaultCurrency));
 const [saving, setSaving] = useState(false);
 const [savingPrizeId, setSavingPrizeId] = useState<string | null>(null);
 const [togglingPrizeId, setTogglingPrizeId] = useState<string | null>(null);
 const [deletingPrizeId, setDeletingPrizeId] = useState<string | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [spinning, setSpinning] = useState(false);
 const [previewWonLabel, setPreviewWonLabel] = useState<string | null>(null);
 const reorderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const pendingOrderRef = useRef<string[] | null>(null);
 const reorderInFlightRef = useRef(false);

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
 rarity_tier: editForm.rarity_tier,
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
 rarity_tier: newPrize.rarity_tier,
 probability_weight: normalizeWinChance(newPrize.probability_weight),
 stock_remaining: parseOptionalStock(newPrize.stock_remaining),
 active: true,
 created_at: new Date(0).toISOString(),
 },
 ];
 }

 return oddsMode === "simple" ? applyTierWinChances(next) : next;
 }, [prizes, editingId, editForm, newPrize, merchantId, oddsMode]);

 const previewPrizes = useMemo(() => activeWheelPrizes(draftPrizes), [draftPrizes]);
 const hiddenInactiveCount = draftPrizes.length - previewPrizes.length;
 const wheelReady = hasMinimumWheelPrizes(draftPrizes);

 const displayPrizeById = useMemo(() => {
 const map = new Map<string, Prize>();
 for (const p of draftPrizes) {
 if (p.id !== "__preview_draft__") map.set(p.id, p);
 }
 return map;
 }, [draftPrizes]);

 const getDisplayPrize = (prize: Prize): Prize => displayPrizeById.get(prize.id) ?? prize;

 const activeCount = useMemo(() => prizes.filter((p) => p.active).length, [prizes]);
 const activeChanceTotal = useMemo(() => totalActiveWinChance(prizes), [prizes]);
 const chancesValid = useMemo(
 () => oddsMode === "simple" || activeWinChanceIsValid(prizes),
 [oddsMode, prizes],
 );

 const applyOddsModeLocally = (nextMode: PrizeOddsMode, list: Prize[]): Prize[] => {
 if (nextMode === "advanced") {
 return applyTierWinChances(list);
 }
 const withTiers = list.map((p) => ({
 ...p,
 rarity_tier: closestTierForPercent(p.probability_weight),
 }));
 return applyTierWinChances(withTiers);
 };

 const syncFormsForOddsMode = (nextMode: PrizeOddsMode, list: Prize[]) => {
 if (nextMode === "advanced") {
 if (editingId) {
 const edited = list.find((p) => p.id === editingId);
 if (edited) {
 setEditForm((f) => ({ ...f, probability_weight: String(edited.probability_weight) }));
 }
 }
 setNewPrize((p) => ({
 ...p,
 probability_weight: String(
 previewWinChanceForTier("__new__", [
 ...list,
 { id: "__new__", active: true, rarity_tier: p.rarity_tier },
 ]) ?? p.probability_weight,
 ),
 }));
 return;
 }
 if (editingId) {
 setEditForm((f) => ({
 ...f,
 rarity_tier: closestTierForPercent(normalizeWinChance(f.probability_weight)),
 }));
 }
 setNewPrize((p) => ({
 ...p,
 rarity_tier: closestTierForPercent(normalizeWinChance(p.probability_weight)),
 }));
 };

 const switchOddsMode = (nextMode: PrizeOddsMode) => {
 if (nextMode === oddsMode) return;
 const prevMode = oddsMode;
 const prevPrizes = prizes;
 const nextPrizes = applyOddsModeLocally(nextMode, prizes);
 setOddsMode(nextMode);
 setPrizes(nextPrizes);
 syncFormsForOddsMode(nextMode, nextPrizes);
 setError(null);

 void fetch("/api/dashboard/prizes/odds-mode", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ mode: nextMode }),
 })
 .then(async (res) => {
 const data = (await res.json().catch(() => ({}))) as { prizes?: Prize[]; error?: string };
 if (!res.ok) {
 setOddsMode(prevMode);
 setPrizes(prevPrizes);
 syncFormsForOddsMode(prevMode, prevPrizes);
 setError(mapPrizeApiError(data.error, t));
 return;
 }
 if (data.prizes) {
 setPrizes((prev) => mergePrizesPreservingOrder(prev, data.prizes!));
 }
 })
 .catch(() => {
 setOddsMode(prevMode);
 setPrizes(prevPrizes);
 syncFormsForOddsMode(prevMode, prevPrizes);
 setError(t("dashboard.prizeSaveFailed"));
 });
 };

 const splitChancesEvenly = async () => {
 const active = prizes.filter((p) => p.active);
 if (active.length === 0) return;
 setError(null);

 const snapshot = prizes;
 const shares = equalWinChances(active.length);
 const shareById = new Map(active.map((p, i) => [p.id, shares[i] ?? 0]));
 setPrizes((prev) =>
 prev.map((p) =>
 shareById.has(p.id) ? { ...p, probability_weight: shareById.get(p.id)! } : p,
 ),
 );

 try {
 const res = await fetch("/api/dashboard/prizes/equalize-chances", { method: "POST" });
 const data = (await res.json().catch(() => ({}))) as { prizes?: Prize[]; error?: string };
 if (!res.ok) {
 setPrizes(snapshot);
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
 } catch {
 setPrizes(snapshot);
 setError(t("dashboard.prizeSaveFailed"));
 }
 };

 const startEdit = (prize: Prize) => {
 if (editingId === prize.id) {
 cancelEdit();
 return;
 }
 setEditingId(prize.id);
 setEditForm(prizeFormFromPrize(prize, defaultCurrency));
 };

 const cancelEdit = () => {
 setEditingId(null);
 };

 const flushReorder = async () => {
 if (reorderInFlightRef.current) return;
 const orderedIds = pendingOrderRef.current?.filter((id) => !id.startsWith("__pending_")) ?? null;
 pendingOrderRef.current = null;
 if (!orderedIds?.length) return;

 reorderInFlightRef.current = true;
 try {
 const res = await fetch("/api/dashboard/prizes/reorder", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ orderedIds }),
 });
 const data = (await res.json().catch(() => ({}))) as { error?: string };
 if (!res.ok) {
 // Keep the optimistic UI order; only surface the sync error.
 setError(mapPrizeApiError(data.error, t));
 if (pendingOrderRef.current && !reorderTimerRef.current) {
 reorderTimerRef.current = setTimeout(() => {
 reorderTimerRef.current = null;
 void flushReorder();
 }, 120);
 }
 }
 } catch {
 setError(t("dashboard.prizeReorderFailed"));
 } finally {
 reorderInFlightRef.current = false;
 if (pendingOrderRef.current) {
 if (reorderTimerRef.current) clearTimeout(reorderTimerRef.current);
 reorderTimerRef.current = setTimeout(() => {
 reorderTimerRef.current = null;
 void flushReorder();
 }, 0);
 }
 }
 };

 const movePrize = (prizeId: string, direction: -1 | 1) => {
 setPrizes((current) => {
 const index = current.findIndex((p) => p.id === prizeId);
 const target = index + direction;
 if (index < 0 || target < 0 || target >= current.length) return current;

 const next = [...current];
 [next[index], next[target]] = [next[target], next[index]];
 pendingOrderRef.current = next.map((p) => p.id);
 setError(null);

 if (reorderTimerRef.current) clearTimeout(reorderTimerRef.current);
 reorderTimerRef.current = setTimeout(() => {
 reorderTimerRef.current = null;
 void flushReorder();
 }, 180);

 return next;
 });
 };

 const applyPrizesList = (data: { prize?: Prize; prizes?: Prize[] }) => {
 setPrizes((prev) => mergePrizesFromApi(prev, data));
 };

 const updatePrizeIcon = (prize: Prize, icon: PrizeIconId) => {
 setError(null);
 const snapshot = prizes;
 setPrizes((p) => p.map((x) => (x.id === prize.id ? { ...x, icon } : x)));
 if (editingId === prize.id) {
 setEditForm((f) => ({ ...f, icon }));
 }

 const redemption = redemptionFormFromPrize(prize);
 void (async () => {
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
 rarity_tier: normalizeRarityTier(prize.rarity_tier),
 stock_remaining: prize.stock_remaining,
 redeem_next_visit: prize.redeem_next_visit,
 redeem_min_spend: redemption.redeem_min_spend,
 redeem_min_spend_currency: redemption.redeem_min_spend_currency,
 redeem_valid_days: prize.redeem_valid_days,
 }),
 });

 if (!apiRes.ok) {
 const errBody = (await apiRes.json().catch(() => ({}))) as { error?: string };
 setPrizes(snapshot);
 setError(mapPrizeApiError(errBody.error, t));
 return;
 }

 const apiData = (await apiRes.json()) as { prize?: Prize; prizes?: Prize[] };
 if (apiData.prize || apiData.prizes) {
 applyPrizesList(apiData);
 }
 })();
 };

 const saveEdit = async (id: string) => {
 const prize = prizes.find((p) => p.id === id);
 if (!prize) return;

 setError(null);
 let payload;
 try {
 payload = buildPrizePayload(editForm);
 } catch (e) {
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

 const snapshot = prizes;
 const optimistic = buildOptimisticPrize(prize, payload);
 let optimisticList = prizes.map((p) => (p.id === id ? optimistic : p));
 if (oddsMode === "simple") {
 optimisticList = applyTierWinChances(optimisticList);
 }

 setPrizes(optimisticList);
 setEditingId(null);
 setSavingPrizeId(id);

 const apiRes = await fetch("/api/dashboard/prizes", {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 id,
 label: payload.label,
 icon: payload.icon,
 prize_mechanic: payload.prize_mechanic,
 social_unlock_platform: payload.social_unlock_platform,
 rarity_tier: payload.rarity_tier,
 probability_weight: payload.probability_weight,
 stock_remaining: payload.stock_remaining,
 redeem_next_visit: payload.redeem_next_visit,
 redeem_min_spend: editForm.redemption.redeem_min_spend,
 redeem_min_spend_currency: editForm.redemption.redeem_min_spend_currency,
 redeem_valid_days: payload.redeem_valid_days,
 }),
 });

 setSavingPrizeId(null);

 if (!apiRes.ok) {
 const errBody = (await apiRes.json().catch(() => ({}))) as { error?: string };
 setPrizes(snapshot);
 setEditingId(id);
 setEditForm(prizeFormFromPrize(prize, defaultCurrency));
 setError(mapPrizeApiError(errBody.error, t));
 return;
 }

 const apiData = (await apiRes.json()) as { prize?: Prize; prizes?: Prize[] };
 applyPrizesList(apiData);
 };

 const addPrize = async () => {
 setError(null);
 let payload;
 try {
 payload = buildPrizePayload(newPrize);
 } catch (e) {
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

 const snapshot = prizes;
 const draftForm = newPrize;
 const tempId = `__pending_${Date.now()}`;
 const optimistic: Prize = {
 id: tempId,
 merchant_id: merchantId,
 label: payload.label,
 icon: payload.icon,
 prize_mechanic: payload.prize_mechanic,
 social_unlock_platform: payload.social_unlock_platform,
 rarity_tier: payload.rarity_tier,
 probability_weight: payload.probability_weight,
 stock_remaining: payload.stock_remaining,
 redeem_next_visit: payload.redeem_next_visit,
 redeem_min_spend_cents: payload.redeem_min_spend_cents,
 redeem_min_spend_currency: payload.redeem_min_spend_currency,
 redeem_valid_days: payload.redeem_valid_days,
 active: true,
 created_at: new Date().toISOString(),
 };

 let optimisticList = [...prizes, optimistic];
 if (oddsMode === "simple") {
 optimisticList = applyTierWinChances(optimisticList);
 }

 setPrizes(optimisticList);
 setNewPrize(emptyPrizeForm(optimisticList, defaultCurrency));

 const apiRes = await fetch("/api/dashboard/prizes", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 label: payload.label,
 icon: payload.icon,
 prize_mechanic: payload.prize_mechanic,
 social_unlock_platform: payload.social_unlock_platform,
 rarity_tier: payload.rarity_tier,
 probability_weight: payload.probability_weight,
 stock_remaining: payload.stock_remaining,
 redeem_next_visit: payload.redeem_next_visit,
 redeem_min_spend: newPrize.redemption.redeem_min_spend,
 redeem_min_spend_currency: newPrize.redemption.redeem_min_spend_currency,
 redeem_valid_days: payload.redeem_valid_days,
 }),
 });

 if (!apiRes.ok) {
 const errBody = (await apiRes.json().catch(() => ({}))) as { error?: string };
 setPrizes(snapshot);
 setNewPrize(draftForm);
 setError(mapPrizeApiError(errBody.error, t));
 return;
 }

 const apiData = (await apiRes.json()) as { prize?: Prize; prizes?: Prize[] };
 const tempIdx = optimisticList.findIndex((p) => p.id === tempId);
 let nextList = optimisticList.filter((p) => p.id !== tempId);
 if (apiData.prize) {
 const insertAt = tempIdx >= 0 ? Math.min(tempIdx, nextList.length) : nextList.length;
 nextList = [...nextList.slice(0, insertAt), apiData.prize, ...nextList.slice(insertAt)];
 } else if (apiData.prizes) {
 nextList = mergePrizesPreservingOrder(nextList, apiData.prizes);
 }
 if (oddsMode === "simple") {
 nextList = applyTierWinChances(nextList);
 }
 setPrizes(nextList);
 setNewPrize(emptyPrizeForm(nextList, defaultCurrency));
 };

 const toggleActive = async (prize: Prize) => {
 const nextActive = !prize.active;
 if (prize.active) {
 const after = prizes.map((p) => (p.id === prize.id ? { ...p, active: false } : p));
 if (!hasMinimumWheelPrizes(after)) {
 setError(t("dashboard.minWheelPrizes"));
 return;
 }
 }

 setError(null);
 const snapshot = prizes;
 let optimistic = prizes.map((p) => (p.id === prize.id ? { ...p, active: nextActive } : p));
 if (oddsMode === "simple") {
 optimistic = applyTierWinChances(optimistic);
 }
 setPrizes(optimistic);
 setTogglingPrizeId(prize.id);

 const apiRes = await fetch("/api/dashboard/prizes", {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ id: prize.id, active: nextActive }),
 });

 setTogglingPrizeId(null);

 if (!apiRes.ok) {
 const errBody = (await apiRes.json().catch(() => ({}))) as { error?: string };
 setPrizes(snapshot);
 setError(mapPrizeApiError(errBody.error, t));
 return;
 }

 const apiData = (await apiRes.json()) as { prize?: Prize; prizes?: Prize[] };
 applyPrizesList(apiData);
 };

 const deletePrize = async (id: string) => {
 const after = prizes.filter((p) => p.id !== id);
 if (!hasMinimumWheelPrizes(after)) {
 setError(t("dashboard.minWheelPrizes"));
 return;
 }

 setError(null);
 const snapshot = prizes;
 const wasEditing = editingId === id;
 let optimistic = after;
 if (oddsMode === "simple") {
 optimistic = applyTierWinChances(optimistic);
 }

 setPrizes(optimistic);
 if (wasEditing) setEditingId(null);
 setDeletingPrizeId(id);

 const apiRes = await fetch(`/api/dashboard/prizes?id=${encodeURIComponent(id)}`, {
 method: "DELETE",
 });

 setDeletingPrizeId(null);

 if (!apiRes.ok) {
 const errBody = (await apiRes.json().catch(() => ({}))) as { error?: string };
 setPrizes(snapshot);
 if (wasEditing) {
 setEditingId(id);
 const restored = snapshot.find((p) => p.id === id);
 if (restored) setEditForm(prizeFormFromPrize(restored, defaultCurrency));
 }
 setError(mapPrizeApiError(errBody.error, t));
 return;
 }

 const apiData = (await apiRes.json().catch(() => ({}))) as { prizes?: Prize[] };
 if (apiData.prizes?.length) {
 setPrizes((prev) => mergePrizesPreservingOrder(prev, apiData.prizes!));
 }
 };

 const ruleSummary = (prize: Prize) => {
 const parts: string[] = [];
 if (prize.redeem_next_visit) parts.push(t("dashboard.redeemNextVisitShort"));
 if (prize.redeem_min_spend_cents && prize.redeem_min_spend_cents > 0) {
 parts.push(
 t("dashboard.redeemMinSpendShort", {
 amount: formatMinSpendAmount(prize.redeem_min_spend_cents, locale, normalizeRedeemCurrency(prize.redeem_min_spend_currency, defaultCurrency)),
 }),
 );
 }
 if (prize.redeem_valid_days && prize.redeem_valid_days > 0) {
 parts.push(t("dashboard.redeemValidDaysShort", { days: prize.redeem_valid_days }));
 }
 return parts.length > 0 ? parts.join(" · ") : t("dashboard.redeemNoRules");
 };

 const prizeListCard = (
 <div className={`${ui.card} min-w-0 overflow-x-clip p-4 sm:p-6`}>
 <div className="flex flex-wrap items-start justify-between gap-3">
 <h2 className={ui.h2}>
 {t("dashboard.prizesConfigured")}
 <span className="ml-2 text-base font-bold text-muted">({activeCount})</span>
 </h2>
 <div className="flex max-w-full rounded-[12px] border-2 border-black p-1 transition-colors duration-150">
 <button
 type="button"
 onClick={() => switchOddsMode("simple")}
 className={`rounded-[8px] px-3 py-1.5 text-xs font-extrabold uppercase transition-colors duration-150 ${
 oddsMode === "simple" ? "bg-black text-white" : "text-ink hover:bg-black/5"
 }`}
 >
 {t("dashboard.prizeOddsSimple")}
 </button>
 <button
 type="button"
 onClick={() => switchOddsMode("advanced")}
 className={`rounded-[8px] px-3 py-1.5 text-xs font-extrabold uppercase transition-colors duration-150 ${
 oddsMode === "advanced" ? "bg-black text-white" : "text-ink hover:bg-black/5"
 }`}
 >
 {t("dashboard.prizeOddsAdvanced")}
 </button>
 </div>
 </div>
 <p className="mt-2 text-sm text-muted">
 {oddsMode === "simple" ? t("dashboard.prizeOddsSimpleHint") : t("dashboard.prizeOddsAdvancedHint")}
 </p>
 {!wheelReady && prizes.some((p) => p.active) && (
 <div className="mb-4 rounded-none border-2 border-amber-600 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900" role="status">
 {t("dashboard.minWheelPrizes", { min: MIN_WHEEL_PRIZES })}
 </div>
 )}

 {prizes.some((p) => p.active) && oddsMode === "advanced" && (
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
 {!chancesValid && oddsMode === "advanced" && prizes.some((p) => p.active) && (
 <p className="mt-2 text-sm font-semibold text-[var(--c-coral,#dc2626)]">
 {t("dashboard.winChancesMustSum100")}
 </p>
 )}
 {prizes.length === 0 ? (
 <p className={`mt-4 ${ui.muted}`}>{t("dashboard.noPrizes")}</p>
 ) : (
 <div className="mt-5 overflow-hidden rounded-[14px] border-2 border-black bg-white ">
 {prizes.map((prize, index) => (
 <div
 key={prize.id}
 className={`bg-white px-4 py-4 ${index > 0 ? "border-t-2 border-black/10" : ""}`}
 >
 {editingId === prize.id ? (
 <div className="space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3">
 <p className="text-sm font-extrabold uppercase tracking-wide text-ink">
 {t("dashboard.editingPrize", { label: editForm.label.trim() || prize.label })}
 </p>
 <div className="flex shrink-0 flex-nowrap items-center gap-2">
 <button
 type="button"
 onClick={() => void saveEdit(prize.id)}
 disabled={savingPrizeId === prize.id || !editForm.label.trim()}
 className={ui.btn}
 >
 {savingPrizeId === prize.id ? t("common.saving") : t("common.save")}
 </button>
 <button type="button" onClick={cancelEdit} className={ui.btnOutline}>
 {t("dashboard.closeEditor")}
 </button>
 </div>
 </div>
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
 {oddsMode === "simple" ? (
 <div>
 <label className={ui.label}>{t("dashboard.prizeRarity")}</label>
 <PrizeRaritySelect
 value={editForm.rarity_tier}
 onChange={(rarity_tier) => setEditForm((f) => ({ ...f, rarity_tier }))}
 />
 <p className="mt-1 text-xs font-medium text-muted">
 {t("dashboard.prizeRarityApprox", {
 pct:
 previewWinChanceForTier(prize.id, draftPrizes) ??
 prize.probability_weight,
 })}
 </p>
 </div>
 ) : (
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
 )}
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
 </div>
 ) : (
 (() => {
 const display = getDisplayPrize(prize);
 return (
 <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
 <div className="flex min-w-0 items-start gap-3">
 <PrizeIconPicker
 variant="compact"
 value={normalizePrizeIcon(display.icon)}
 onChange={(icon) => updatePrizeIcon(prize, icon)}
 />
 <div className="min-w-0">
 <p className="text-sm font-semibold text-ink">{display.label}</p>
 <p className="mt-0.5 font-mono text-xs text-muted">
 {oddsMode === "simple" ? (
 <>
 <PrizeRarityBadge tier={normalizeRarityTier(display.rarity_tier)} />
 {" · "}
 {t("dashboard.prizeRarityApprox", {
 pct: prizeWinChancePercent(display, draftPrizes) ?? display.probability_weight,
 })}
 </>
 ) : (
 (() => {
 const pct = prizeWinChancePercent(display, draftPrizes);
 return pct != null
 ? t("dashboard.winChanceSummary", { pct })
 : t("dashboard.winChanceInactive");
 })()
 )}
 {display.stock_remaining !== null && ` · ${t("common.stock")} ${display.stock_remaining}`}
 {!display.active && ` · ${t("common.inactive")}`}
 {display.prize_mechanic && resolvePrizeMechanic(display) !== "standard" && (
 <> · {t(mechanicLabelKey(resolvePrizeMechanic(display)))}</>
 )}
 </p>
 <p className="mt-1 text-xs font-medium text-muted">{ruleSummary(display)}</p>
 </div>
 </div>
 <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
 <div className="flex shrink-0 flex-col gap-1">
 <button
 type="button"
 onClick={() => movePrize(prize.id, -1)}
 disabled={index === 0}
 aria-label={t("dashboard.prizeMoveUp")}
 title={t("dashboard.prizeMoveUp")}
 className={`${ui.btnOutline} !h-8 !w-9 !shrink-0 !px-0 !py-0 text-sm font-black leading-none`}
 >
 ↑
 </button>
 <button
 type="button"
 onClick={() => movePrize(prize.id, 1)}
 disabled={index >= prizes.length - 1}
 aria-label={t("dashboard.prizeMoveDown")}
 title={t("dashboard.prizeMoveDown")}
 className={`${ui.btnOutline} !h-8 !w-9 !shrink-0 !px-0 !py-0 text-sm font-black leading-none`}
 >
 ↓
 </button>
 </div>
 <button
 type="button"
 onClick={() => startEdit(prize)}
 className={`${ui.btnOutline} shrink-0 whitespace-nowrap !px-3 !py-1.5 text-sm`}
 >
 {editingId === prize.id ? t("dashboard.closeEditor") : t("common.edit")}
 </button>
 <button
 type="button"
 onClick={() => void toggleActive(prize)}
 disabled={
 togglingPrizeId === prize.id ||
 (prize.active &&
 !hasMinimumWheelPrizes(
 prizes.map((p) => (p.id === prize.id ? { ...p, active: false } : p)),
 ))
 }
 className={`${ui.btnOutline} shrink-0 whitespace-nowrap !px-3 !py-1.5 text-sm`}
 >
 {togglingPrizeId === prize.id
 ? t("common.saving")
 : prize.active
 ? t("common.deactivate")
 : t("common.activate")}
 </button>
 <button
 type="button"
 onClick={() => void deletePrize(prize.id)}
 disabled={!hasMinimumWheelPrizes(prizes.filter((p) => p.id !== prize.id))}
 aria-label={t("common.delete")}
 title={t("common.delete")}
 className={`${ui.btnDanger} !h-auto !w-9 !shrink-0 !px-0 !py-2`}
 >
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
 <path d="M3 6h18" />
 <path d="M8 6V4h8v2" />
 <path d="M19 6l-1 14H6L5 6" />
 <path d="M10 11v6M14 11v6" />
 </svg>
 </button>
 </div>
 </div>
 );
 })()
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 );

 const previewCard = (
 <section className={`${ui.card} min-w-0 overflow-x-clip p-4 sm:p-6 lg:sticky lg:top-6`}>
 <h2 className={ui.h2}>{t("dashboard.prizeWheelPreviewTitle")}</h2>
 <p className={`mt-2 ${ui.muted}`}>{t("dashboard.prizeWheelPreviewHint")}</p>

 <div className="mt-5 flex w-full min-w-0 flex-col items-center gap-4">
 {!wheelReady ? (
 <p className="py-8 text-center text-sm font-semibold text-muted">
 {previewPrizes.length === 0
 ? t("dashboard.prizeWheelPreviewEmpty")
 : t("dashboard.minWheelPrizes", { min: MIN_WHEEL_PRIZES })}
 </p>
 ) : (
 <Wheel
 prizes={previewPrizes}
 primaryColor={primaryColor}
 secondaryColor={secondaryColor}
 colors={theme.wheel}
 spinning={spinning}
 setSpinning={setSpinning}
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
 <div className="min-w-0 space-y-8 overflow-x-clip">
 {error && <p className={ui.alertError}>{error}</p>}

 <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-start">
 <div className="order-2 min-w-0 space-y-8 lg:order-1">
 {prizeListCard}

 <div className={`${ui.card} min-w-0 overflow-x-clip p-4 sm:p-6`}>
 <h2 className={ui.h2}>{t("dashboard.addPrize")}</h2>
 <div className="mt-5 grid min-w-0 items-start gap-4 sm:grid-cols-3">
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
 {oddsMode === "simple" ? (
 <div>
 <label className={ui.label}>{t("dashboard.prizeRarity")}</label>
 <PrizeRaritySelect
 value={newPrize.rarity_tier}
 onChange={(rarity_tier) => setNewPrize((p) => ({ ...p, rarity_tier }))}
 disabled={saving}
 />
 {clampPrizeLabel(newPrize.label) && (
 <p className="mt-1 text-xs font-medium text-muted">
 {t("dashboard.prizeRarityApprox", {
 pct:
 previewWinChanceForTier("__preview_draft__", draftPrizes) ??
 newPrize.probability_weight,
 })}
 </p>
 )}
 </div>
 ) : (
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
 )}
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

 <div className="order-1 min-w-0 lg:order-2">{previewCard}</div>
 </div>
 </div>
 );
}
