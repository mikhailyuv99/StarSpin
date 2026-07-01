import type { Prize } from "./types";

export function pickWeightedPrize(prizes: Prize[]): Prize | null {
  const eligible = prizes.filter(
    (p) => p.active && (p.stock_remaining === null || p.stock_remaining > 0),
  );
  if (eligible.length === 0) return null;

  const totalWeight = eligible.reduce((sum, p) => sum + p.probability_weight, 0);
  let roll = Math.random() * totalWeight;

  for (const prize of eligible) {
    roll -= prize.probability_weight;
    if (roll <= 0) return prize;
  }

  return eligible[eligible.length - 1] ?? null;
}

export function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function describeSlice(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export function contrastTextColor(bg: string): string {
  const hex = bg.replace("#", "");
  if (hex.length !== 6) return "#0a0a0a";
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.58 ? "#0a0a0a" : "#ffffff";
}

/** Minimum slice angle (degrees) before we draw a label on the wheel. */
export function shouldShowSliceLabel(sliceAngle: number): boolean {
  return sliceAngle >= 14;
}

export function labelFontSize(sliceAngle: number): number {
  if (sliceAngle < 22) return 6.5;
  if (sliceAngle < 35) return 7.5;
  return Math.min(12, Math.max(8, sliceAngle * 0.17));
}

export function sliceLabelRadius(r: number, sliceAngle: number): number {
  const hub = 0.38;
  const outer = 0.24;
  const t = Math.min(1, sliceAngle / 120);
  return r * (hub + outer * t);
}

/** Tangential text aligned to slice — always upright to the reader. */
export function sliceLabelRotation(mid: number): number {
  return mid > 90 && mid < 270 ? mid + 180 : mid;
}

export function wheelSliceLabel(label: string, sliceAngle: number): string {
  const maxChars =
    sliceAngle < 22 ? 5 : sliceAngle < 35 ? 8 : sliceAngle < 55 ? 11 : sliceAngle < 90 ? 15 : 22;
  const trimmed = label.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, Math.max(3, maxChars - 1))}…`;
}

export function prizeSliceAngles(prizes: Prize[]): { prize: Prize; start: number; end: number }[] {
  const eligible = prizes.filter(
    (p) => p.active && (p.stock_remaining === null || p.stock_remaining > 0),
  );
  const totalWeight = eligible.reduce((sum, p) => sum + p.probability_weight, 0);
  let current = 0;

  return eligible.map((prize) => {
    const slice = (prize.probability_weight / totalWeight) * 360;
    const start = current;
    const end = current + slice;
    current = end;
    return { prize, start, end };
  });
}
