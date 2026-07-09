import type { Prize } from "./types";
import { isRetryPoolExcluded } from "./prize-mechanics";

/** Max characters merchants can enter; wheel layout also clamps at render time. */
export const PRIZE_LABEL_MAX_LENGTH = 24;

export function clampPrizeLabel(label: string, max = PRIZE_LABEL_MAX_LENGTH): string {
  const trimmed = label.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trimEnd();
}


function arcChordWidth(radius: number, sliceAngleDeg: number): number {
  const halfRad = ((sliceAngleDeg / 2) * Math.PI) / 180;
  return 2 * radius * Math.sin(halfRad);
}

function maxCharsForArc(arcWidth: number, fontSize: number): number {
  const charWidth = fontSize * 0.58;
  return Math.max(3, Math.floor(arcWidth / charWidth) - 1);
}

function wrapLabelWords(label: string, maxChars: number, maxLines: number): string[] {
  const words = label.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }
    const candidate = `${current} ${word}`;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;

  const kept = lines.slice(0, maxLines - 1);
  kept.push(lines.slice(maxLines - 1).join(" "));
  return kept;
}

export type WheelSliceLabelLayout = {
  lines: string[];
  fontSize: number;
  labelRadius: number;
  lineHeight: number;
  visible: boolean;
};

/** Layout prize text inside one wheel slice (viewBox 0–100 coordinate system). */
export function layoutWheelSliceLabel(
  label: string,
  sliceAngle: number,
  sliceCount: number,
  wheelRadius = 44,
): WheelSliceLabelLayout {
  const safe = clampPrizeLabel(label);
  if (!shouldShowSliceLabel(sliceAngle) || !safe) {
    return { lines: [], fontSize: 0, labelRadius: 0, lineHeight: 0, visible: false };
  }

  const labelRadius = sliceLabelRadius(wheelRadius, sliceAngle);
  const maxLines = sliceAngle < 28 ? 1 : sliceAngle < 52 ? 2 : sliceAngle < 90 ? 3 : 4;
  let fontSize = labelFontSizeSvg(sliceAngle, sliceCount);

  for (let attempt = 0; attempt < 8; attempt++) {
    const arcWidth = arcChordWidth(labelRadius, sliceAngle * 0.82);
    const maxChars = maxCharsForArc(arcWidth, fontSize);
    const lines = wrapLabelWords(safe, maxChars, maxLines);
    const fits = lines.every((line) => line.length <= maxChars);
    if (fits && lines.length <= maxLines) {
      return {
        lines,
        fontSize,
        labelRadius,
        lineHeight: fontSize * 1.12,
        visible: true,
      };
    }
    fontSize = Math.max(2.6, fontSize * 0.9);
  }

  const arcWidth = arcChordWidth(labelRadius, sliceAngle * 0.82);
  const maxChars = Math.max(3, maxCharsForArc(arcWidth, 2.6));
  const lines = wrapLabelWords(safe, maxChars, maxLines);
  return {
    lines,
    fontSize: 2.6,
    labelRadius,
    lineHeight: 2.6 * 1.12,
    visible: lines.length > 0,
  };
}

/** Font size for SVG viewBox 0–100 wheels (not pixel-sized SVGs). */
export function labelFontSizeSvg(sliceAngle: number, sliceCount: number): number {
  let size = sliceAngle < 30 ? 3.1 : sliceAngle < 45 ? 3.5 : sliceAngle < 72 ? 4 : 4.6;
  if (sliceCount > 8) size -= 0.35;
  if (sliceCount > 10) size -= 0.25;
  return Math.max(2.8, Math.min(size, 5));
}

export function pickWeightedPrize(prizes: Prize[]): Prize | null {
  const eligible = prizes.filter(
    (p) => p.active && (p.stock_remaining === null || p.stock_remaining > 0),
  );
  if (eligible.length === 0) return null;

  const totalWeight = eligible.reduce((sum, p) => sum + p.probability_weight, 0);
  if (totalWeight <= 0) return null;

  const roll = Math.random() * (totalWeight === 100 ? 100 : totalWeight);
  let cursor = roll;

  for (const prize of eligible) {
    cursor -= prize.probability_weight;
    if (cursor <= 0) return prize;
  }

  return eligible[eligible.length - 1] ?? null;
}

/** Re-roll after retry / near-miss (excludes mechanic slices that re-trigger). */
export function pickRetrySpinPrize(prizes: Prize[]): Prize | null {
  const pool = prizes.filter(
    (p) =>
      p.active &&
      (p.stock_remaining === null || p.stock_remaining > 0) &&
      !isRetryPoolExcluded(p),
  );
  return pickWeightedPrize(pool);
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
  const span = endAngle - startAngle;
  if (span >= 359.99) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
  }

  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = span <= 180 ? 0 : 1;
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
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines - 1);
  kept.push(lines.slice(maxLines - 1).join(" "));
  return kept;
}

/** Width of an arc at a given radius (SVG viewBox units). */
export function arcChordWidthAtRadius(radius: number, sliceAngleDeg: number): number {
  const halfRad = ((sliceAngleDeg / 2) * Math.PI) / 180;
  return 2 * radius * Math.sin(halfRad);
}

export type WheelSliceIconLayout = {
  iconSize: number;
  labelRadius: number;
};

/** Size & radial position for a prize icon inside one equal wedge (viewBox 0–100). */
export function layoutWheelSliceIcon(
  sliceAngleDeg: number,
  sliceCount: number,
  wheelRadius = 44,
): WheelSliceIconLayout {
  const hubRadius = 10;
  const labelRadius = sliceLabelRadius(wheelRadius, sliceAngleDeg);
  const halfRad = ((sliceAngleDeg / 2) * Math.PI) / 180;
  // Conservative square that fits inside the wedge without clipping corners.
  const angularLimit = 2 * labelRadius * Math.sin(halfRad) * 0.82;
  const radialLimit =
    Math.min(labelRadius - hubRadius, wheelRadius - 2 - labelRadius) * 1.45;
  const byCount = 46 / Math.sqrt(Math.max(sliceCount, 1));
  const iconSize = Math.min(17.5, Math.max(7, Math.min(angularLimit, radialLimit, byCount)));
  return { iconSize, labelRadius };
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

/** Equal visual slices for the wheel UI (spin odds still use weights). */
export function prizeEqualSliceAngles(prizes: Prize[]): { prize: Prize; start: number; end: number }[] {
  const eligible = prizes.filter(
    (p) => p.active && (p.stock_remaining === null || p.stock_remaining > 0),
  );
  if (eligible.length === 0) return [];

  const sliceAngle = 360 / eligible.length;
  return eligible.map((prize, i) => ({
    prize,
    start: i * sliceAngle,
    end: (i + 1) * sliceAngle,
  }));
}

export function wheelEligiblePrizes(prizes: Prize[]): Prize[] {
  return prizes.filter((p) => p.active && (p.stock_remaining === null || p.stock_remaining > 0));
}

export function totalPrizeWeight(prizes: Prize[]): number {
  return wheelEligiblePrizes(prizes).reduce((sum, p) => sum + p.probability_weight, 0);
}

/** Literal win % stored on the prize (active wheel prizes should sum to 100). */
export function prizeWinChancePercent(prize: Prize, _prizes?: Prize[]): number | null {
  if (!prize.active || (prize.stock_remaining !== null && prize.stock_remaining <= 0)) return null;
  return prize.probability_weight;
}
