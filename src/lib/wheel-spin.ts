import type { Prize } from "@/lib/types";

export type WheelSlice = { prize: Prize; start: number; end: number };

/** Angle on the disc (0° = top) currently under the fixed pointer. */
export function pointerAngleOnDisc(rotationDeg: number): number {
  return ((360 - (rotationDeg % 360)) + 360) % 360;
}

export function sliceIndexAtPointer(rotationDeg: number, slices: WheelSlice[]): number {
  if (slices.length === 0) return 0;
  const angle = pointerAngleOnDisc(rotationDeg);
  const idx = slices.findIndex((s) => angle >= s.start && angle < s.end);
  if (idx >= 0) return idx;
  return slices.length - 1;
}

/** How many equal-slice boundaries the pointer crossed between two disc rotations. */
export function equalSliceBoundaryCrossings(
  prevRotation: number,
  nextRotation: number,
  sliceCount: number,
): number {
  if (sliceCount <= 0) return 0;
  const delta = nextRotation - prevRotation;
  if (delta <= 0) return 0;
  const sliceDeg = 360 / sliceCount;
  return Math.max(0, Math.floor(delta / sliceDeg));
}

export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

/** Degrees to add so the slice midpoint lands under the fixed top pointer. */
export function computeSpinDelta(currentRotation: number, sliceMid: number, extraTurns = 5): number {
  const targetMod = ((360 - sliceMid) % 360 + 360) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let delta = (targetMod - currentMod + 360) % 360;
  if (delta < 90) delta += 360;
  return extraTurns * 360 + delta;
}
