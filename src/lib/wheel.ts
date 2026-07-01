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

export function labelFontSize(sliceAngle: number, sliceCount: number): number {
  const byAngle = sliceAngle * 0.18;
  const byCount = sliceCount > 8 ? 7.5 : sliceCount > 5 ? 9 : 10.5;
  return Math.min(12, Math.max(7, Math.min(byAngle, byCount)));
}

/** Keep slice labels right-side up on the wheel */
export function sliceLabelRotation(mid: number): number {
  return mid > 90 && mid < 270 ? mid + 180 : mid;
}

export function splitSliceLabel(label: string, sliceAngle: number): string[] {
  const maxChars = sliceAngle < 35 ? 9 : sliceAngle < 55 ? 12 : sliceAngle < 90 ? 16 : 22;
  const maxLines = sliceAngle < 40 ? 2 : 3;
  const words = label.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;
  const merged = lines.slice(0, maxLines - 1);
  merged.push(lines.slice(maxLines - 1).join(" "));
  return merged;
}

export function sliceLabelRadius(r: number, sliceAngle: number): number {
  const hubClearance = 0.34;
  const outerBias = Math.min(sliceAngle, 140) / 360;
  return r * (hubClearance + outerBias * 0.34);
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
