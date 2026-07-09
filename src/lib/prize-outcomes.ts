import {
  isNoWinMechanic,
  isNonClaimMechanic,
  isRetryMechanic,
  resolvePrizeMechanic,
} from "@/lib/prize-mechanics";
import type { Prize } from "@/lib/types";

/** Wheel outcomes that grant a free re-spin instead of a claimable prize. */
export function isRetrySpinPrize(prize: Pick<Prize, "prize_mechanic" | "icon">): boolean {
  return isRetryMechanic(prize);
}

/** Wheel outcomes with no claimable reward (session ends). */
export function isNoWinPrize(prize: Pick<Prize, "prize_mechanic" | "icon">): boolean {
  return isNoWinMechanic(prize);
}

/** Non-claimable wheel faces (retry, near miss, mystery, double-or-nothing, empty). */
export function isOutcomePrize(prize: Pick<Prize, "prize_mechanic" | "icon">): boolean {
  return isNonClaimMechanic(prize) || isNoWinPrize(prize);
}

export function isNearMissPrize(prize: Pick<Prize, "prize_mechanic" | "icon">): boolean {
  return resolvePrizeMechanic(prize) === "near_miss";
}

export function isMysteryPrize(prize: Pick<Prize, "prize_mechanic" | "icon">): boolean {
  return resolvePrizeMechanic(prize) === "mystery";
}

export function isDoubleOrNothingPrize(prize: Pick<Prize, "prize_mechanic" | "icon">): boolean {
  return resolvePrizeMechanic(prize) === "double_or_nothing";
}
