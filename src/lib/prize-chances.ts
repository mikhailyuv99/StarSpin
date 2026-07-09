import type { Prize } from "@/lib/types";

export const WIN_CHANCE_TARGET = 100;

export function wheelEligiblePrizes(prizes: Prize[]): Prize[] {
  return prizes.filter((p) => p.active && (p.stock_remaining === null || p.stock_remaining > 0));
}

export function parseWinChancePercent(raw: string | number): number {
  const n = typeof raw === "number" ? raw : parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.floor(n)));
}

export function totalWinChance(prizes: Prize[]): number {
  return wheelEligiblePrizes(prizes).reduce((sum, p) => sum + p.probability_weight, 0);
}

export function activePrizes(prizes: Prize[]): Prize[] {
  return prizes.filter((p) => p.active);
}

export function totalActiveWinChance(prizes: Prize[]): number {
  return activePrizes(prizes).reduce((sum, p) => sum + p.probability_weight, 0);
}

export function activeWinChanceIsValid(prizes: Prize[]): boolean {
  const active = activePrizes(prizes);
  if (active.length === 0) return true;
  return totalActiveWinChance(prizes) === WIN_CHANCE_TARGET;
}

/** Split 100% evenly across prizes (remainder to first slices). */
export function equalWinChances(count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(WIN_CHANCE_TARGET / count);
  const remainder = WIN_CHANCE_TARGET - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

export function redistributeWinChances(prizes: Prize[], targetIds?: string[]): Prize[] {
  const ids = targetIds ?? prizes.map((p) => p.id);
  const count = ids.length;
  if (count === 0) return prizes;
  const shares = equalWinChances(count);
  const map = new Map(ids.map((id, i) => [id, shares[i] ?? 0]));
  return prizes.map((p) => (map.has(p.id) ? { ...p, probability_weight: map.get(p.id)! } : p));
}

export function sanitizeWinChanceDraft(raw: string): string {
  return raw.replace(/[^\d]/g, "").slice(0, 3);
}
