import type { Prize } from "@/lib/types";
import { pickWeightedPrize, wheelEligiblePrizes } from "@/lib/wheel";
import {
  isDoubleOrNothingMechanic,
  isMysteryMechanic,
  isNearMissMechanic,
  pickBestStandardPrize,
  resolvePrizeMechanic,
} from "@/lib/prize-mechanics";

export type SpinResolution = {
  displayPrize: Prize;
  resolvedPrizeId: string | null;
  nearMissTargetLabel: string | null;
};

function pickWeightedStandardPrize(prizes: Prize[], excludeIds: string[]): Prize | null {
  const pool = wheelEligiblePrizes(prizes).filter(
    (p) => resolvePrizeMechanic(p) === "standard" && !excludeIds.includes(p.id),
  );
  return pickWeightedPrize(pool);
}

/** Resolve mystery / double-or-nothing / near-miss metadata for a wheel outcome. */
export function resolveSpinOutcome(prizes: Prize[], selected: Prize): SpinResolution {
  if (isMysteryMechanic(selected) || isDoubleOrNothingMechanic(selected)) {
    const resolved = pickWeightedStandardPrize(prizes, [selected.id]);
    return {
      displayPrize: selected,
      resolvedPrizeId: resolved?.id ?? null,
      nearMissTargetLabel: null,
    };
  }

  if (isNearMissMechanic(selected)) {
    const best = pickBestStandardPrize(prizes);
    return {
      displayPrize: selected,
      resolvedPrizeId: null,
      nearMissTargetLabel: best?.label ?? null,
    };
  }

  return {
    displayPrize: selected,
    resolvedPrizeId: null,
    nearMissTargetLabel: null,
  };
}

export function prizeForClaim(
  displayPrize: Prize,
  resolvedPrize: Prize | null | undefined,
): Prize {
  return resolvedPrize ?? displayPrize;
}
