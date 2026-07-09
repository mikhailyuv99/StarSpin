import type { Prize } from "@/lib/types";

export type PrizeRarityTier = "common" | "uncommon" | "rare" | "epic" | "jackpot";
export type PrizeOddsMode = "simple" | "advanced";

export const PRIZE_RARITY_TIERS: PrizeRarityTier[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "jackpot",
];

export const RARITY_TIER_WEIGHTS: Record<PrizeRarityTier, number> = {
  common: 50,
  uncommon: 25,
  rare: 12,
  epic: 8,
  jackpot: 5,
};

const TIER_SET = new Set<string>(PRIZE_RARITY_TIERS);

export function normalizePrizeOddsMode(raw: unknown): PrizeOddsMode {
  return raw === "advanced" ? "advanced" : "simple";
}

export function normalizeRarityTier(raw: unknown): PrizeRarityTier {
  if (typeof raw === "string" && TIER_SET.has(raw)) {
    return raw as PrizeRarityTier;
  }
  return "common";
}

/** Integer win % per active prize from tier weights (always sums to 100). */
export function winChancesFromTiers(
  prizes: Pick<Prize, "id" | "active" | "rarity_tier">[],
): Map<string, number> {
  const active = prizes.filter((p) => p.active);
  const totalWeight = active.reduce(
    (sum, p) => sum + RARITY_TIER_WEIGHTS[normalizeRarityTier(p.rarity_tier)],
    0,
  );
  if (active.length === 0 || totalWeight <= 0) return new Map();

  const parts = active.map((p) => {
    const weight = RARITY_TIER_WEIGHTS[normalizeRarityTier(p.rarity_tier)];
    const exact = (weight / totalWeight) * 100;
    const floor = Math.floor(exact);
    return { id: p.id, floor, frac: exact - floor };
  });

  let remainder = 100 - parts.reduce((sum, p) => sum + p.floor, 0);
  const ranked = [...parts].sort((a, b) => b.frac - a.frac);
  for (let i = 0; remainder > 0; i += 1, remainder -= 1) {
    ranked[i % ranked.length].floor += 1;
  }

  return new Map(parts.map((p) => [p.id, p.floor]));
}

export function previewWinChanceForTier(
  prizeId: string,
  prizes: Pick<Prize, "id" | "active" | "rarity_tier">[],
): number | null {
  return winChancesFromTiers(prizes).get(prizeId) ?? null;
}

export function applyTierWinChances(prizes: Prize[]): Prize[] {
  const map = winChancesFromTiers(prizes);
  return prizes.map((p) =>
    map.has(p.id) ? { ...p, probability_weight: map.get(p.id)! } : p,
  );
}

export function closestTierForPercent(percent: number): PrizeRarityTier {
  const target = Math.max(1, percent);
  let best: PrizeRarityTier = "common";
  let bestDiff = Infinity;
  for (const tier of PRIZE_RARITY_TIERS) {
    const sample = winChancesFromTiers([
      { id: "a", active: true, rarity_tier: tier },
      { id: "b", active: true, rarity_tier: "common" },
      { id: "c", active: true, rarity_tier: "common" },
      { id: "d", active: true, rarity_tier: "common" },
    ]).get("a");
    const diff = Math.abs((sample ?? 0) - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = tier;
    }
  }
  return best;
}
