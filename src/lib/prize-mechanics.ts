import { normalizePrizeIcon, type PrizeIconId } from "@/lib/prize-icons";
import type { Prize } from "@/lib/types";

export type SocialUnlockPlatform = "instagram" | "facebook" | "tiktok";

export const SOCIAL_UNLOCK_PLATFORMS: SocialUnlockPlatform[] = [
  "instagram",
  "facebook",
  "tiktok",
];

export function normalizeSocialUnlockPlatform(
  value: string | null | undefined,
): SocialUnlockPlatform | null {
  if (value && (SOCIAL_UNLOCK_PLATFORMS as readonly string[]).includes(value)) {
    return value as SocialUnlockPlatform;
  }
  return null;
}

export function isSocialUnlockPlatform(value: string): value is SocialUnlockPlatform {
  return (SOCIAL_UNLOCK_PLATFORMS as readonly string[]).includes(value);
}
export const PRIZE_MECHANICS = [
  "standard",
  "retry",
  "no_win",
  "near_miss",
  "mystery",
  "double_or_nothing",
  "social_unlock",
] as const;

export type PrizeMechanic = (typeof PRIZE_MECHANICS)[number];

export const DEFAULT_PRIZE_MECHANIC: PrizeMechanic = "standard";

export function normalizePrizeMechanic(value: string | null | undefined): PrizeMechanic {
  if (value && (PRIZE_MECHANICS as readonly string[]).includes(value)) {
    return value as PrizeMechanic;
  }
  return DEFAULT_PRIZE_MECHANIC;
}

export function prizeMechanicFromLegacyIcon(icon: string | null | undefined): PrizeMechanic {
  const id = normalizePrizeIcon(icon);
  if (id === "try_again") return "retry";
  if (id === "no_prize") return "no_win";
  return "standard";
}

export function resolvePrizeMechanic(prize: Pick<Prize, "prize_mechanic" | "icon">): PrizeMechanic {
  if (prize.prize_mechanic) return normalizePrizeMechanic(prize.prize_mechanic);
  return prizeMechanicFromLegacyIcon(prize.icon);
}

/** Default wheel icon when a mechanic is selected. */
export const MECHANIC_DEFAULT_ICON: Record<PrizeMechanic, PrizeIconId> = {
  standard: "cupcake",
  retry: "try_again",
  no_win: "no_prize",
  near_miss: "sparkles",
  mystery: "mystery",
  double_or_nothing: "fire",
  social_unlock: "star",
};

export function defaultIconForMechanic(mechanic: PrizeMechanic): PrizeIconId {
  return MECHANIC_DEFAULT_ICON[mechanic];
}

export function isRetryMechanic(prize: Pick<Prize, "prize_mechanic" | "icon">): boolean {
  return resolvePrizeMechanic(prize) === "retry";
}

export function isNearMissMechanic(prize: Pick<Prize, "prize_mechanic" | "icon">): boolean {
  return resolvePrizeMechanic(prize) === "near_miss";
}

export function isMysteryMechanic(prize: Pick<Prize, "prize_mechanic" | "icon">): boolean {
  return resolvePrizeMechanic(prize) === "mystery";
}

export function isDoubleOrNothingMechanic(prize: Pick<Prize, "prize_mechanic" | "icon">): boolean {
  return resolvePrizeMechanic(prize) === "double_or_nothing";
}

export function isSocialUnlockMechanic(prize: Pick<Prize, "prize_mechanic" | "icon">): boolean {
  return resolvePrizeMechanic(prize) === "social_unlock";
}

export function isNoWinMechanic(prize: Pick<Prize, "prize_mechanic" | "icon">): boolean {
  return resolvePrizeMechanic(prize) === "no_win";
}

/** Slices that skip stock decrement and direct claim on land. */
export function isNonClaimMechanic(prize: Pick<Prize, "prize_mechanic" | "icon">): boolean {
  const m = resolvePrizeMechanic(prize);
  return (
    m === "retry" ||
    m === "no_win" ||
    m === "near_miss" ||
    m === "mystery" ||
    m === "double_or_nothing"
  );
}

export function isRetryPoolExcluded(prize: Pick<Prize, "prize_mechanic" | "icon">): boolean {
  const m = resolvePrizeMechanic(prize);
  return (
    m === "retry" ||
    m === "near_miss" ||
    m === "mystery" ||
    m === "double_or_nothing"
  );
}

export function merchantNeedsSocialBonusStep(prizes: Prize[]): boolean {
  return requiredSocialUnlockPlatforms(prizes).length > 0;
}

/** Unique social platforms required by active social-unlock slices (stable order). */
export function requiredSocialUnlockPlatforms(prizes: Prize[]): SocialUnlockPlatform[] {
  const needed = new Set<SocialUnlockPlatform>();
  for (const prize of prizes) {
    if (!prize.active) continue;
    if (prize.stock_remaining !== null && prize.stock_remaining <= 0) continue;
    if (!isSocialUnlockMechanic(prize)) continue;
    const platform = normalizeSocialUnlockPlatform(prize.social_unlock_platform);
    if (platform) needed.add(platform);
  }
  return SOCIAL_UNLOCK_PLATFORMS.filter((p) => needed.has(p));
}

export function pickBestStandardPrize(prizes: Prize[]): Prize | null {
  const pool = prizes.filter(
    (p) =>
      p.active &&
      (p.stock_remaining === null || p.stock_remaining > 0) &&
      resolvePrizeMechanic(p) === "standard",
  );
  if (pool.length === 0) return null;
  return pool.reduce((best, p) => (p.probability_weight > best.probability_weight ? p : best));
}
