import type { PrizeIconDef } from "@/lib/prize-icons";

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
