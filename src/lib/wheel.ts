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
  const rgb = parseColorRgb(bg);
  if (!rgb) return "#0a0a0a";
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.55 ? "#0a0a0a" : "#ffffff";
}

function parseColorRgb(input: string): { r: number; g: number; b: number } | null {
  const value = input.trim();
  if (value.startsWith("#")) {
    let hex = value.slice(1);
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    if (hex.length !== 6) return null;
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
    };
  }
  const rgbMatch = value.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgbMatch) {
    return { r: Number(rgbMatch[1]), g: Number(rgbMatch[2]), b: Number(rgbMatch[3]) };
  }
  return null;
}

/** Always try to show a label; hide only on extremely thin slices */
export function shouldShowSliceLabel(sliceAngle: number): boolean {
  return sliceAngle >= 10;
}

export function labelFontSize(sliceAngle: number, sliceCount: number): number {
  const byAngle = sliceAngle * 0.16;
  const byCount = sliceCount > 8 ? 8 : sliceCount > 5 ? 9.5 : 11;
  const cap = sliceAngle < 30 ? 9 : sliceAngle < 55 ? 11 : 13;
  return Math.min(cap, Math.max(7.5, Math.min(byAngle, byCount)));
}

export function sliceLabelRotation(mid: number): number {
  return mid > 90 && mid < 270 ? mid + 180 : mid;
}

export function splitSliceLabel(label: string, sliceAngle: number): string[] {
  const maxChars = sliceAngle < 20 ? 8 : sliceAngle < 35 ? 11 : sliceAngle < 70 ? 15 : 22;
  const maxLines = sliceAngle < 25 ? 1 : sliceAngle < 50 ? 2 : 3;
  const words = label.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word.length > maxChars ? `${word.slice(0, maxChars - 1)}…` : word;
    } else if (candidate.length > maxChars) {
      lines.push(`${word.slice(0, maxChars - 1)}…`);
      current = "";
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

/** Place label in the readable zone of each slice */
export function sliceLabelRadius(r: number, sliceAngle: number): number {
  const t = Math.min(Math.max(sliceAngle / 360, 0.1), 0.38);
  return r * (0.52 + t * 0.42);
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
