/**
 * Prize wheel icons — cute food pack (Vecteezy) + Twemoji + offer/service marks.
 */

import {
  MARK_ICON_ID_LIST,
  PRIZE_ASSET_MANIFEST,
  PRIZE_ICON_GROUP_ORDER,
  PRIZE_ICON_LABELS,
} from "./prize-icon-assets";

export type PrizeIconGroupId = (typeof PRIZE_ICON_GROUP_ORDER)[number];

export type PrizeIconId =
  | (typeof PRIZE_ASSET_MANIFEST)[number]["id"]
  | (typeof MARK_ICON_ID_LIST)[number];

export const PRIZE_ICON_IDS = [
  ...PRIZE_ASSET_MANIFEST.map((e) => e.id),
  ...MARK_ICON_ID_LIST,
] as const satisfies readonly PrizeIconId[];

export type PrizeIconShape = {
  d: string;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: "round" | "butt" | "square";
  strokeLinejoin?: "round" | "miter" | "bevel";
};

export type PrizeIconDef = {
  id: PrizeIconId;
  group: PrizeIconGroupId;
  plate: string;
  src?: string;
  shapes?: PrizeIconShape[];
  fit?: string;
  markText?: string;
  markTextSize?: number;
  /** Optical centering tweak for raster assets (fraction of icon size). */
  assetNudge?: { x: number; y: number; scale: number };
  /** Extra scale on the wheel only (1 = default optical size). */
  wheelScale?: number;
};

export const DEFAULT_PRIZE_ICON: PrizeIconId = "cupcake";

const LEGACY_ICON_ALIASES: Record<string, PrizeIconId> = {
  drink: "soda",
  coffee: "coffee_cup",
  cocktail: "smoothie",
  beer: "beer",
  dessert: "cupcake",
  cake: "birthday_cake",
  ice_cream: "ice_cream_cone",
  pizza: "pizza_slice",
  burger: "burger_cute",
  bowl: "salad",
  donut: "donut_classic",
  tea_hot: "tea",
  pasta: "spaghetti",
  noodles: "ramen",
};

const INK = "#1a1523";

type MarkIconId = (typeof MARK_ICON_ID_LIST)[number];

function assetFromManifest(entry: (typeof PRIZE_ASSET_MANIFEST)[number]): PrizeIconDef {
  const hasNudge =
    ("nudgeX" in entry && entry.nudgeX != null) ||
    ("nudgeY" in entry && entry.nudgeY != null) ||
    ("assetScale" in entry && entry.assetScale != null);

  const nudge = hasNudge
    ? {
        x: "nudgeX" in entry && typeof entry.nudgeX === "number" ? entry.nudgeX : 0,
        y: "nudgeY" in entry && typeof entry.nudgeY === "number" ? entry.nudgeY : 0,
        scale:
          "assetScale" in entry && typeof entry.assetScale === "number" ? entry.assetScale : 1,
      }
    : undefined;

  return {
    id: entry.id,
    group: entry.group,
    plate: entry.plate,
    src: `/prize-icons/${entry.id}.webp`,
    assetNudge: nudge,
    wheelScale: "wheelScale" in entry && typeof entry.wheelScale === "number" ? entry.wheelScale : 1,
  };
}

function percentMark(
  id: MarkIconId,
  label: string,
  accent: string,
  plate: string,
  textSize = 7,
): PrizeIconDef {
  return {
    id,
    group: "offers",
    plate,
    shapes: [
      {
        d: "M4.2 4.2h15.6a1.8 1.8 0 0 1 1.8 1.8v11.2a1.8 1.8 0 0 1-1.8 1.8H4.2a1.8 1.8 0 0 1-1.8-1.8V6a1.8 1.8 0 0 1 1.8-1.8z",
        fill: accent,
        stroke: INK,
        strokeWidth: 1.1,
      },
    ],
    markText: label,
    markTextSize: textSize,
  };
}

const MARK_ICON_LABELS: Record<MarkIconId, string> = {
  percent_5: "5% off",
  percent_10: "10% off",
  percent_15: "15% off",
  percent_20: "20% off",
  percent_25: "25% off",
  percent_30: "30% off",
  percent_50: "50% off",
  percent_100: "100% off",
  coupon: "Coupon",
  gift: "Gift",
  scissors: "Scissors",
  clippers: "Clippers",
  ticket: "Ticket",
  star: "Star",
  wifi: "Wi‑Fi",
  try_again: "Try again",
  no_prize: "No prize",
  mystery: "Mystery",
  heart: "Heart",
  trophy: "Trophy",
};

const MARK_ICONS: Record<MarkIconId, PrizeIconDef> = {
  percent_5: percentMark("percent_5", "5%", "#8b5cf6", "#efe9ff"),
  percent_10: percentMark("percent_10", "10%", "#3b82f6", "#e8f0ff"),
  percent_15: percentMark("percent_15", "15%", "#10b981", "#e7f9ef"),
  percent_20: percentMark("percent_20", "20%", "#f59e0b", "#fff3e0"),
  percent_25: percentMark("percent_25", "25%", "#a855f7", "#f3e8ff", 6.4),
  percent_30: percentMark("percent_30", "30%", "#06b6d4", "#ecfeff", 6.4),
  percent_50: percentMark("percent_50", "50%", "#ef4444", "#ffe8ec", 6.4),
  percent_100: percentMark("percent_100", "100%", "#dc2626", "#fee2e2", 5.4),
  coupon: {
    id: "coupon",
    group: "offers",
    plate: "#fff6d8",
    shapes: [
      {
        d: "M3.8 8.4A2.2 2.2 0 0 1 6 6.2h12a2.2 2.2 0 0 1 2.2 2.2v1A1.5 1.5 0 0 0 19 11a1.5 1.5 0 0 0 1.2 1.4v1A2.2 2.2 0 0 1 18 15.8H6A2.2 2.2 0 0 1 3.8 13.6v-1A1.5 1.5 0 0 0 5 11a1.5 1.5 0 0 0-1.2-1.4v-1.2z",
        fill: "#fbbf24",
        stroke: INK,
        strokeWidth: 1,
      },
      { d: "M9.2 8.8h1.3v5.2H9.2zm4.3 0H14.8v5.2h-1.3z", fill: INK },
    ],
  },
  gift: {
    id: "gift",
    group: "offers",
    plate: "#ffe4f0",
    shapes: [
      { d: "M5.2 11.2h13.6v7.6A1.6 1.6 0 0 1 17.2 20.4H6.8A1.6 1.6 0 0 1 5.2 18.8v-7.6z", fill: "#fb7185", stroke: INK, strokeWidth: 1 },
      { d: "M4.6 8.4h14.8a1.4 1.4 0 0 1 0 2.8H4.6a1.4 1.4 0 1 1 0-2.8z", fill: "#fda4af", stroke: INK, strokeWidth: 1 },
      { d: "M11.2 8.4v12h1.6v-12z", fill: "#f472b6" },
      { d: "M12 8.4c-1.6-2.2-4-2.5-4.9-1.3S7.4 9.8 9.4 9.4c1.1-.25 1.9-.55 2.6-.9 1.6-2.2 4-2.5 4.9-1.3s.3 2.7-1.7 3.1c-1.1-.25-1.9-.55-2.6-.9z", fill: "#fbbf24", stroke: INK, strokeWidth: 0.9 },
    ],
  },
  scissors: {
    id: "scissors",
    group: "services",
    plate: "#eef2ff",
    shapes: [
      { d: "M7.5 4.8a2.4 2.4 0 1 1-1.7 4L10.2 13l-4.1 3.8a2.4 2.4 0 1 1 1.8 1.2L11.6 14l4.8 4.6a1.1 1.1 0 0 0 1.55-1.55L13 12.4l4.9-4.9a1.1 1.1 0 1 0-1.55-1.55L11.6 10.7 8 7.2a2.4 2.4 0 0 1-.5-2.4z", fill: "#94a3b8", stroke: INK, strokeWidth: 1 },
      { d: "M6.4 5.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zm0 9.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z", fill: "#6366f1" },
    ],
  },
  clippers: {
    id: "clippers",
    group: "services",
    plate: "#eceff4",
    shapes: [
      { d: "M9.2 3.4h5.6v2.8l1 .7v1.5H8.2V6.9l1-.7V3.4z", fill: "#cbd5e1", stroke: INK, strokeWidth: 1 },
      { d: "M8.4 10.2h7.2v1.9l-.9.9v5.5A1.6 1.6 0 0 1 13.1 20H10.9A1.6 1.6 0 0 1 9.3 18.5v-5.5l-.9-.9v-1.9z", fill: "#64748b", stroke: INK, strokeWidth: 1 },
      { d: "M10.4 4.4h1V6h-1zm2.2 0h1V6h-1z", fill: INK },
      { d: "M10.6 15.6h2.8v2.8h-2.8z", fill: "#38bdf8" },
    ],
  },
  ticket: {
    id: "ticket",
    group: "services",
    plate: "#fff0e0",
    shapes: [
      { d: "M4 8.5A2 2 0 0 1 6 6.5h12a2 2 0 0 1 2 2v1.1A1.4 1.4 0 0 0 18.8 11 1.4 1.4 0 0 0 20 12.3v1.2A2 2 0 0 1 18 15.5H6a2 2 0 0 1-2-2v-1.2A1.4 1.4 0 0 0 5.2 11 1.4 1.4 0 0 0 4 9.6V8.5z", fill: "#fb923c", stroke: INK, strokeWidth: 1 },
      { d: "M9.2 8.9h1.3v5H9.2z", fill: INK },
      { d: "M12.2 9.4h5v1.1h-5zm0 2.3h5v1.1h-5z", fill: "#ffedd5" },
    ],
  },
  wifi: {
    id: "wifi",
    group: "services",
    plate: "#e0f2fe",
    shapes: [
      { d: "M12 18.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z", fill: "#0ea5e9" },
      { d: "M7.8 15.2a6.8 6.8 0 0 1 8.4 0", fill: "none", stroke: "#38bdf8", strokeWidth: 1.8 },
      { d: "M5.2 12.2a10.4 10.4 0 0 1 13.6 0", fill: "none", stroke: "#7dd3fc", strokeWidth: 1.8 },
      { d: "M2.6 9.2a14 14 0 0 1 18.8 0", fill: "none", stroke: "#bae6fd", strokeWidth: 1.8 },
    ],
  },
  star: {
    id: "star",
    group: "services",
    plate: "#fff6cc",
    shapes: [
      { d: "M12 3.2 14.2 9h6l-4.85 3.7 1.85 6L12 15.4 6.8 18.7l1.85-6L3.8 9h6L12 3.2z", fill: "#facc15", stroke: INK, strokeWidth: 1 },
      { d: "M12 7.2 12.9 9.8h2.8l-2.25 1.7.85 2.8L12 12.8l-2.3 1.5.85-2.8-2.25-1.7h2.8L12 7.2z", fill: "#fef08a" },
    ],
  },
  try_again: {
    id: "try_again",
    group: "outcomes",
    plate: "#dbeafe",
    shapes: [
      {
        d: "M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z",
        fill: "#2563eb",
        stroke: INK,
        strokeWidth: 1,
        strokeLinejoin: "round",
      },
    ],
  },
  no_prize: {
    id: "no_prize",
    group: "outcomes",
    plate: "#f1f1f4",
    shapes: [
      { d: "M12 3.8a8.2 8.2 0 1 1 0 16.4 8.2 8.2 0 0 1 0-16.4z", fill: "#cbd5e1", stroke: INK, strokeWidth: 1 },
      { d: "M12 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4z", fill: "#e2e8f0" },
      { d: "M8.6 8.6 15.4 15.4", fill: "none", stroke: "#ef4444", strokeWidth: 2.2 },
      { d: "M15.4 8.6 8.6 15.4", fill: "none", stroke: "#ef4444", strokeWidth: 2.2 },
    ],
  },
  mystery: {
    id: "mystery",
    group: "outcomes",
    plate: "#ede9fe",
    shapes: [
      {
        d: "M4.2 4.2h15.6a1.8 1.8 0 0 1 1.8 1.8v11.2a1.8 1.8 0 0 1-1.8 1.8H4.2a1.8 1.8 0 0 1-1.8-1.8V6a1.8 1.8 0 0 1 1.8-1.8z",
        fill: "#8b5cf6",
        stroke: INK,
        strokeWidth: 1.1,
      },
    ],
    markText: "?",
    markTextSize: 11,
  },
  heart: {
    id: "heart",
    group: "extra",
    plate: "#ffe4ec",
    shapes: [
      { d: "M12 19.6 5.2 12.8A4.4 4.4 0 0 1 12 6.4a4.4 4.4 0 0 1 6.8 6.4L12 19.6z", fill: "#fb7185", stroke: INK, strokeWidth: 1 },
      { d: "M8.4 9.2c.7-.9 1.8-1.2 2.7-.7", fill: "none", stroke: "#fecdd3", strokeWidth: 1.4 },
    ],
  },
  trophy: {
    id: "trophy",
    group: "extra",
    plate: "#fff4d4",
    shapes: [
      { d: "M8.2 4.2h7.6v2c1.6.35 2.8 1.55 3.1 3.15H20a.9.9 0 0 1 .9.9v1A3.4 3.4 0 0 1 17.5 14.7h-1.2A4.5 4.5 0 0 1 13 17.2V18.5h2a.9.9 0 1 1 0 1.8H9a.9.9 0 1 1 0-1.8h2V17.2A4.5 4.5 0 0 1 7.7 14.7H6.5A3.4 3.4 0 0 1 3.1 11.25v-1a.9.9 0 0 1 .9-.9h1.1C5.4 7.75 6.6 6.55 8.2 6.2v-2z", fill: "#fbbf24", stroke: INK, strokeWidth: 1 },
      { d: "M9.4 7.2h5.2v5.1c0 1.4-1.1 2.5-2.6 2.5s-2.6-1.1-2.6-2.5V7.2z", fill: "#fde68a" },
      { d: "M4.8 10h1.5v1.8H4.8zm12.9 0H19.2v1.8h-1.5z", fill: "#f59e0b" },
    ],
  },
};

const iconsByGroup = Object.fromEntries(
  PRIZE_ICON_GROUP_ORDER.map((id) => [id, [] as PrizeIconId[]]),
) as Record<PrizeIconGroupId, PrizeIconId[]>;

for (const entry of PRIZE_ASSET_MANIFEST) {
  iconsByGroup[entry.group].push(entry.id);
}
for (const id of MARK_ICON_ID_LIST) {
  iconsByGroup[MARK_ICONS[id].group].push(id);
}

export const PRIZE_ICON_GROUPS: { id: PrizeIconGroupId; icons: PrizeIconId[] }[] =
  PRIZE_ICON_GROUP_ORDER.map((id) => ({ id, icons: iconsByGroup[id] })).filter(
    (g) => g.icons.length > 0,
  );

const ASSET_CATALOG: PrizeIconDef[] = PRIZE_ASSET_MANIFEST.map((entry) => assetFromManifest(entry));

export const PRIZE_ICONS: Record<PrizeIconId, PrizeIconDef> = {
  ...Object.fromEntries(ASSET_CATALOG.map((d) => [d.id, d])),
  ...MARK_ICONS,
} as Record<PrizeIconId, PrizeIconDef>;

/** Raster assets with tight artwork need a smaller wheel slot to match the pack baseline. */
const WHEEL_SCALE_OVERRIDES: Partial<Record<PrizeIconId, number>> = {
  tea: 0.74,
  teapot: 0.74,
  bubble_tea: 0.78,
  coffee_cup: 0.82,
  beer: 0.8,
  broccoli: 0.85,
  mushroom: 0.85,
  pineapple: 0.82,
};

for (const [id, scale] of Object.entries(WHEEL_SCALE_OVERRIDES)) {
  const icon = PRIZE_ICONS[id as PrizeIconId];
  if (icon) icon.wheelScale = scale;
}

export function isPrizeIconId(value: string | null | undefined): value is PrizeIconId {
  return Boolean(value && (PRIZE_ICON_IDS as readonly string[]).includes(value));
}

export function normalizePrizeIcon(value: string | null | undefined): PrizeIconId {
  if (!value) return DEFAULT_PRIZE_ICON;
  if (isPrizeIconId(value)) return value;
  const aliased = LEGACY_ICON_ALIASES[value];
  return aliased ?? DEFAULT_PRIZE_ICON;
}

export function prizeIconLabelKey(id: PrizeIconId): string {
  return `dashboard.prizeIcon_${id}`;
}

export function prizeIconGroupLabelKey(id: PrizeIconGroupId): string {
  return `dashboard.prizeIconGroup_${id}`;
}

/** English label from manifest, with optional i18n override. */
export function formatPrizeIconLabel(
  id: PrizeIconId,
  t: (key: string) => string,
): string {
  const key = prizeIconLabelKey(id);
  const translated = t(key);
  if (translated !== key) return translated;
  return PRIZE_ICON_LABELS[id] ?? MARK_ICON_LABELS[id as MarkIconId] ?? id;
}

export const PRIZE_ICON_ATTRIBUTION = {
  text: "Icons: Vecteezy & Twemoji",
  href: "https://www.vecteezy.com/",
} as const;
