import {
  isDoubleOrNothingMechanic,
  isMysteryMechanic,
  resolvePrizeMechanic,
} from "@/lib/prize-mechanics";
import type { Prize } from "@/lib/types";

/** Prize whose stock should decrement when the spin row is created (not mystery / double-or-nothing). */
export function stockPrizeOnSpinCreate(selected: Prize, resolvedPrize: Prize | null): Prize | null {
  if (isMysteryMechanic(selected) || isDoubleOrNothingMechanic(selected)) {
    return null;
  }
  if (isNonClaimDisplayMechanic(selected)) {
    return null;
  }
  return resolvedPrize ?? selected;
}

function isNonClaimDisplayMechanic(prize: Pick<Prize, "prize_mechanic" | "icon">): boolean {
  const m = resolvePrizeMechanic(prize);
  return m === "retry" || m === "no_win" || m === "near_miss";
}

/** Whether this spin may receive a claimable prize code. */
export function canClaimSpin(
  displayPrize: Prize | null | undefined,
  resolvedPrizeId: string | null | undefined,
): boolean {
  if (!displayPrize) return false;
  const mechanic = resolvePrizeMechanic(displayPrize);
  if (mechanic === "retry" || mechanic === "no_win" || mechanic === "near_miss") {
    return false;
  }
  if (mechanic === "mystery" || mechanic === "double_or_nothing") {
    return Boolean(resolvedPrizeId);
  }
  return true;
}

/** Prize whose stock decrements when the customer claims (mystery / double-or-nothing). */
export function stockPrizeOnClaim(
  displayPrize: Prize,
  claimPrize: Prize,
  resolvedPrizeId: string | null | undefined,
): Prize | null {
  const mechanic = resolvePrizeMechanic(displayPrize);
  if (mechanic === "mystery" || mechanic === "double_or_nothing") {
    return resolvedPrizeId ? claimPrize : null;
  }
  return claimPrize;
}
