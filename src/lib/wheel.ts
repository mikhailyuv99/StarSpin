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

export function truncateLabel(label: string, max = 14): string {
  if (label.length <= max) return label;
  return `${label.slice(0, max - 1)}…`;
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
