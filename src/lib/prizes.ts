import type { Prize } from "@/lib/types";
import { wheelEligiblePrizes } from "@/lib/prize-chances";

/** A wheel needs at least two slices to render and spin correctly. */
export const MIN_WHEEL_PRIZES = 2;

/** Prizes eligible for the public wheel (active + in stock). */
export function activeWheelPrizes(prizes: Prize[]): Prize[] {
  return wheelEligiblePrizes(prizes);
}

export function wheelPrizeCount(prizes: Prize[]): number {
  return activeWheelPrizes(prizes).length;
}

export function hasMinimumWheelPrizes(prizes: Prize[]): boolean {
  return wheelPrizeCount(prizes) >= MIN_WHEEL_PRIZES;
}
