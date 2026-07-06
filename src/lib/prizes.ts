import type { Prize } from "@/lib/types";

/** Prizes eligible for the public wheel (active + in stock). */
export function activeWheelPrizes(prizes: Prize[]): Prize[] {
  return prizes.filter((p) => p.active && (p.stock_remaining === null || p.stock_remaining > 0));
}
