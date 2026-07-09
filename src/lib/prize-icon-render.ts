import type { PrizeIconDef } from "@/lib/prize-icons";

/** Uniform drawable size for raster icons on the wheel (fraction of wedge icon slot). */
export const WHEEL_RASTER_FILL = 0.7;

export function wheelRasterDrawSize(
  iconSize: number,
  wheelScale = 1,
  nudgeScale = 1,
): number {
  return iconSize * WHEEL_RASTER_FILL * wheelScale * nudgeScale;
}

/** Apply per-asset optical centering (Twemoji padding varies by glyph). */
export function rasterIconTransform(
  nudge: PrizeIconDef["assetNudge"],
  size: number,
): string | undefined {
  if (!nudge || (nudge.x === 0 && nudge.y === 0 && nudge.scale === 1)) return undefined;
  const dx = nudge.x * size;
  const dy = nudge.y * size;
  return `translate(${dx} ${dy}) scale(${nudge.scale})`;
}

export function rasterIconOriginOffset(size: number, scale: number): number {
  return (-size / 2) * scale;
}
