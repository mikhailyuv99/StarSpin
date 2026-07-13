import { contrastTextColor } from "@/lib/wheel";
import type { Merchant } from "@/lib/types";

/**
 * Customer-journey visual themes.
 *
 * Each template is a set of CSS custom properties (applied to `.public-flow`),
 * a wheel color palette, and a Google-fonts pair. The public journey CSS reads
 * these `--pj-*` variables (falling back to the original neo-brutalist values),
 * so adding a template is data-only.
 *
 * Persisted on `merchants.journey_theme` (jsonb) following the `qr_design`
 * pattern: versioned + defensively parsed because the browser writes it via RLS.
 */

export type JourneyTemplateId =
  | "pop"
  | "arcade"
  | "aurora"
  | "luxe"
  | "noir"
  | "candy"
  | "minimal";

export const JOURNEY_TEMPLATE_IDS: JourneyTemplateId[] = [
  "pop",
  "arcade",
  "aurora",
  "luxe",
  "noir",
  "candy",
  "minimal",
];

export const DEFAULT_JOURNEY_TEMPLATE: JourneyTemplateId = "pop";

export interface JourneyThemeConfig {
  v: 1;
  template: JourneyTemplateId;
  /** Optional accent override (hex). Falls back to the template's signature accent. */
  accent: string | null;
}

interface WheelTheme {
  palette: string[];
  stroke: string;
  label: string;
  rim: string;
  hub: string;
  hubDot: string;
  pointer: string;
  pointerInner: string;
}

interface JourneyTemplateDef {
  id: JourneyTemplateId;
  /** Signature accent used when the merchant has not picked a custom one. */
  accent: string;
  /** Google-fonts families to load (empty = use the globally-loaded fonts). */
  fonts: { family: string; axis: string }[];
  vars: Record<string, string>;
  wheel: WheelTheme;
}

const FONT_DISPLAY_FALLBACK = "var(--font-display), system-ui, sans-serif";
const FONT_BODY_FALLBACK = "var(--font-body), system-ui, sans-serif";

export const JOURNEY_TEMPLATES: Record<JourneyTemplateId, JourneyTemplateDef> = {
  // Neo-brutalist "pop" — loud, confident, playful. Hard shadows, dotted paper.
  pop: {
    id: "pop",
    accent: "#ffd23f",
    fonts: [],
    vars: {
      "--pj-bg": "#f4ecd6",
      "--pj-bg-accent": "rgba(155,127,232,0.16)",
      "--pj-orb-1": "rgba(155,127,232,0.4)",
      "--pj-orb-2": "rgba(255,210,63,0.5)",
      "--pj-orb-3": "rgba(244,143,177,0.4)",
      "--pj-spark": "transparent",
      "--pj-glow": "rgba(155,127,232,0.4)",
      "--pj-ink": "#0a0a0a",
      "--pj-muted": "#57534e",
      "--pj-card-bg": "#ffffff",
      "--pj-card-border": "3px solid #0a0a0a",
      "--pj-card-radius": "22px",
      "--pj-card-shadow": "none",
      "--pj-btn-radius": "14px",
      "--pj-btn-border": "3px solid #0a0a0a",
      "--pj-btn-shadow": "none",
      "--pj-btn-hover-shadow": "none",
      "--pj-outline-bg": "#ffffff",
      "--pj-outline-ink": "#0a0a0a",
      "--pj-input-bg": "#ffffff",
      "--pj-input-border": "2.5px solid #0a0a0a",
      "--pj-input-radius": "14px",
      "--pj-progress-bg": "#ffffff",
      "--pj-progress-border": "2.5px solid #0a0a0a",
      "--pj-pill-idle-bg": "#ffffff",
      "--pj-pill-idle-ink": "#57534e",
      "--pj-pill-idle-border": "2.5px solid #0a0a0a",
      "--pj-pill-active-bg": "#0a0a0a",
      "--pj-pill-active-ink": "#ffffff",
      "--pj-pill-shadow": "none",
      "--pj-logo-radius": "16px",
      "--pj-logo-border": "3px solid #0a0a0a",
      "--pj-coupon-bg": "#fff8e3",
      "--pj-font-display": FONT_DISPLAY_FALLBACK,
      "--pj-font-body": FONT_BODY_FALLBACK,
      "--pj-heading-transform": "uppercase",
      "--pj-heading-spacing": "0",
    },
    wheel: {
      palette: ["#ffd23f", "#d8ccf5", "#f48fb1", "#a8e6cf", "#b8cfe8", "#f4a89a"],
      stroke: "#0a0a0a",
      label: "#0a0a0a",
      rim: "#0a0a0a",
      hub: "#ffffff",
      hubDot: "#ffd23f",
      pointer: "#0a0a0a",
      pointerInner: "#ffd23f",
    },
  },

  // Dark neon arcade — glowing, game-machine energy.
  arcade: {
    id: "arcade",
    accent: "#ff3ea5",
    fonts: [],
    vars: {
      "--pj-bg":
        "radial-gradient(120% 90% at 50% -10%, #3a1d6e 0%, #1a0f3d 45%, #0b0a1f 100%)",
      "--pj-bg-accent": "rgba(0,229,255,0.16)",
      "--pj-orb-1": "rgba(124,92,255,0.5)",
      "--pj-orb-2": "rgba(0,229,255,0.4)",
      "--pj-orb-3": "rgba(255,62,165,0.4)",
      "--pj-spark": "rgba(0,229,255,0.9)",
      "--pj-glow": "rgba(0,229,255,0.55)",
      "--pj-ink": "#f4f1ff",
      "--pj-muted": "#b6a8e0",
      "--pj-card-bg": "rgba(24,18,52,0.82)",
      "--pj-card-border": "1.5px solid rgba(124,92,255,0.7)",
      "--pj-card-radius": "18px",
      "--pj-card-shadow": "none",
      "--pj-btn-radius": "12px",
      "--pj-btn-border": "1.5px solid rgba(255,255,255,0.25)",
      "--pj-btn-shadow": "none",
      "--pj-btn-hover-shadow": "none",
      "--pj-outline-bg": "rgba(255,255,255,0.06)",
      "--pj-outline-ink": "#f4f1ff",
      "--pj-input-bg": "rgba(11,10,31,0.6)",
      "--pj-input-border": "1.5px solid rgba(124,92,255,0.6)",
      "--pj-input-radius": "12px",
      "--pj-input-ink": "#f4f1ff",
      "--pj-progress-bg": "rgba(11,10,31,0.7)",
      "--pj-progress-border": "1.5px solid rgba(124,92,255,0.6)",
      "--pj-pill-idle-bg": "rgba(11,10,31,0.6)",
      "--pj-pill-idle-ink": "#8f80c4",
      "--pj-pill-idle-border": "1.5px solid rgba(124,92,255,0.45)",
      "--pj-pill-active-bg": "#ff3ea5",
      "--pj-pill-active-ink": "#0b0a1f",
      "--pj-pill-shadow": "none",
      "--pj-logo-radius": "14px",
      "--pj-logo-border": "1.5px solid rgba(0,229,255,0.7)",
      "--pj-coupon-bg": "rgba(11,10,31,0.55)",
      "--pj-font-display": `${FONT_DISPLAY_FALLBACK}`,
      "--pj-font-body": `${FONT_BODY_FALLBACK}`,
      "--pj-heading-transform": "uppercase",
      "--pj-heading-spacing": "0.04em",
    },
    wheel: {
      palette: ["#ff3ea5", "#7c5cff", "#00e5ff", "#ffd166", "#06d6a0", "#c14bff"],
      stroke: "#0b0a1f",
      label: "#0b0a1f",
      rim: "#00e5ff",
      hub: "#0b0a1f",
      hubDot: "#00e5ff",
      pointer: "#00e5ff",
      pointerInner: "#ff3ea5",
    },
  },

  // Aurora — holographic glass, animated iridescent gradient, dreamy modern.
  aurora: {
    id: "aurora",
    accent: "#7c5cff",
    fonts: [],
    vars: {
      "--pj-bg":
        "linear-gradient(125deg, #ffd6ef 0%, #d3e4ff 30%, #d9fff1 55%, #e9d5ff 80%, #ffd6ef 100%)",
      "--pj-bg-size": "300% 300%",
      "--pj-bg-accent": "rgba(124,92,255,0.16)",
      "--pj-orb-1": "rgba(255,158,207,0.6)",
      "--pj-orb-2": "rgba(142,232,255,0.55)",
      "--pj-orb-3": "rgba(208,165,255,0.6)",
      "--pj-spark": "rgba(255,255,255,0.95)",
      "--pj-glow": "rgba(124,92,255,0.4)",
      "--pj-ink": "#2a2350",
      "--pj-muted": "#6f679a",
      "--pj-card-bg": "rgba(255,255,255,0.55)",
      "--pj-card-border": "1px solid rgba(255,255,255,0.75)",
      "--pj-card-radius": "24px",
      "--pj-card-shadow": "none",
      "--pj-card-backdrop": "blur(14px)",
      "--pj-btn-radius": "999px",
      "--pj-btn-border": "1px solid rgba(255,255,255,0.7)",
      "--pj-btn-shadow": "none",
      "--pj-btn-hover-shadow": "none",
      "--pj-outline-bg": "rgba(255,255,255,0.5)",
      "--pj-outline-ink": "#2a2350",
      "--pj-input-bg": "rgba(255,255,255,0.6)",
      "--pj-input-border": "1px solid rgba(255,255,255,0.8)",
      "--pj-input-radius": "16px",
      "--pj-progress-bg": "rgba(255,255,255,0.55)",
      "--pj-progress-border": "1px solid rgba(255,255,255,0.8)",
      "--pj-pill-idle-bg": "rgba(255,255,255,0.55)",
      "--pj-pill-idle-ink": "#8f88b8",
      "--pj-pill-idle-border": "1px solid rgba(255,255,255,0.8)",
      "--pj-pill-active-bg": "#7c5cff",
      "--pj-pill-active-ink": "#ffffff",
      "--pj-pill-shadow": "none",
      "--pj-logo-radius": "20px",
      "--pj-logo-border": "1px solid rgba(255,255,255,0.8)",
      "--pj-coupon-bg": "rgba(255,255,255,0.55)",
      "--pj-font-display": `${FONT_DISPLAY_FALLBACK}`,
      "--pj-font-body": `${FONT_BODY_FALLBACK}`,
      "--pj-heading-transform": "none",
      "--pj-heading-spacing": "-0.01em",
    },
    wheel: {
      palette: ["#ff9ecf", "#a5b8ff", "#9af5d4", "#d0a5ff", "#ffd59e", "#8ee8ff"],
      stroke: "#ffffff",
      label: "#2a2350",
      rim: "#7c5cff",
      hub: "#ffffff",
      hubDot: "#7c5cff",
      pointer: "#7c5cff",
      pointerInner: "#ffffff",
    },
  },

  // Luxe — ivory + gold editorial. Fine serif display, hairline gold rules.
  luxe: {
    id: "luxe",
    accent: "#b8912f",
    fonts: [],
    vars: {
      "--pj-bg": "linear-gradient(180deg, #faf5ec 0%, #f0e6d2 100%)",
      "--pj-bg-accent": "rgba(184,145,47,0.14)",
      "--pj-orb-1": "rgba(184,145,47,0.24)",
      "--pj-orb-2": "rgba(233,214,170,0.55)",
      "--pj-orb-3": "rgba(191,155,106,0.24)",
      "--pj-spark": "rgba(200,162,74,0.9)",
      "--pj-glow": "rgba(184,145,47,0.28)",
      "--pj-ink": "#241c12",
      "--pj-muted": "#8a7a5f",
      "--pj-card-bg": "#fffdf7",
      "--pj-card-border": "1px solid #e4d6b6",
      "--pj-card-radius": "14px",
      "--pj-card-shadow": "none",
      "--pj-btn-radius": "8px",
      "--pj-btn-border": "1px solid rgba(184,145,47,0.5)",
      "--pj-btn-shadow": "none",
      "--pj-btn-hover-shadow": "none",
      "--pj-outline-bg": "#fffdf7",
      "--pj-outline-ink": "#241c12",
      "--pj-input-bg": "#fffdf7",
      "--pj-input-border": "1px solid #d9c9a3",
      "--pj-input-radius": "8px",
      "--pj-progress-bg": "#ebdcc0",
      "--pj-progress-border": "1px solid #d9c9a3",
      "--pj-pill-idle-bg": "#fffdf7",
      "--pj-pill-idle-ink": "#b0a081",
      "--pj-pill-idle-border": "1px solid #dcc9a1",
      "--pj-pill-active-bg": "#b8912f",
      "--pj-pill-active-ink": "#fffdf7",
      "--pj-pill-shadow": "none",
      "--pj-logo-radius": "50%",
      "--pj-logo-border": "1px solid #cbb37a",
      "--pj-coupon-bg": "#f7efdd",
      "--pj-font-display": `Georgia, "Times New Roman", Georgia, serif`,
      "--pj-font-body": `${FONT_BODY_FALLBACK}`,
      "--pj-heading-transform": "none",
      "--pj-heading-spacing": "0.01em",
    },
    wheel: {
      palette: ["#efe0bb", "#dcbf8c", "#b8912f", "#cbb37a", "#e7d6b0", "#c8a24a"],
      stroke: "#b8945a",
      label: "#241c12",
      rim: "#b8912f",
      hub: "#fffdf7",
      hubDot: "#b8912f",
      pointer: "#241c12",
      pointerInner: "#b8912f",
    },
  },

  // Noir — dark, sophisticated. Deep charcoal, warm gold, Cormorant serif.
  noir: {
    id: "noir",
    accent: "#d4af5f",
    fonts: [],
    vars: {
      "--pj-bg": "radial-gradient(120% 100% at 50% -10%, #2a241d 0%, #161310 45%, #0b0908 100%)",
      "--pj-bg-accent": "rgba(212,175,95,0.12)",
      "--pj-orb-1": "rgba(212,175,95,0.28)",
      "--pj-orb-2": "rgba(212,175,95,0.16)",
      "--pj-orb-3": "rgba(150,120,60,0.22)",
      "--pj-spark": "rgba(212,175,95,0.9)",
      "--pj-glow": "rgba(212,175,95,0.4)",
      "--pj-ink": "#f3ead6",
      "--pj-muted": "#a89b7e",
      "--pj-card-bg": "rgba(28,24,19,0.72)",
      "--pj-card-border": "1px solid rgba(212,175,95,0.4)",
      "--pj-card-radius": "14px",
      "--pj-card-shadow": "none",
      "--pj-card-backdrop": "blur(10px)",
      "--pj-btn-radius": "8px",
      "--pj-btn-border": "1px solid rgba(212,175,95,0.55)",
      "--pj-btn-shadow": "none",
      "--pj-btn-hover-shadow": "none",
      "--pj-outline-bg": "rgba(255,255,255,0.05)",
      "--pj-outline-ink": "#f3ead6",
      "--pj-input-bg": "rgba(0,0,0,0.3)",
      "--pj-input-border": "1px solid rgba(212,175,95,0.4)",
      "--pj-input-radius": "8px",
      "--pj-input-ink": "#f3ead6",
      "--pj-progress-bg": "rgba(255,255,255,0.08)",
      "--pj-progress-border": "1px solid rgba(212,175,95,0.4)",
      "--pj-pill-idle-bg": "rgba(255,255,255,0.05)",
      "--pj-pill-idle-ink": "#8f8265",
      "--pj-pill-idle-border": "1px solid rgba(212,175,95,0.3)",
      "--pj-pill-active-bg": "#d4af5f",
      "--pj-pill-active-ink": "#161310",
      "--pj-pill-shadow": "none",
      "--pj-logo-radius": "50%",
      "--pj-logo-border": "1px solid rgba(212,175,95,0.6)",
      "--pj-coupon-bg": "rgba(0,0,0,0.3)",
      "--pj-font-display": `Georgia, "Times New Roman", Georgia, serif`,
      "--pj-font-body": `${FONT_BODY_FALLBACK}`,
      "--pj-heading-transform": "none",
      "--pj-heading-spacing": "0.02em",
    },
    wheel: {
      palette: ["#d4af5f", "#e8d9b0", "#8a6f3a", "#c8a24a", "#3a3128", "#b8945a"],
      stroke: "#161310",
      label: "#161310",
      rim: "#d4af5f",
      hub: "#161310",
      hubDot: "#d4af5f",
      pointer: "#d4af5f",
      pointerInner: "#f3ead6",
    },
  },

  // Candy — bubbly pastel, super rounded, playful.
  candy: {
    id: "candy",
    accent: "#ff5fa2",
    fonts: [],
    vars: {
      "--pj-bg": "linear-gradient(160deg, #ffe3f1 0%, #e7f0ff 55%, #e8fbf3 100%)",
      "--pj-bg-accent": "rgba(255,95,162,0.16)",
      "--pj-orb-1": "rgba(255,143,199,0.55)",
      "--pj-orb-2": "rgba(184,225,255,0.6)",
      "--pj-orb-3": "rgba(195,240,202,0.55)",
      "--pj-spark": "rgba(255,255,255,0.95)",
      "--pj-glow": "rgba(255,95,162,0.4)",
      "--pj-ink": "#6b2d5c",
      "--pj-muted": "#a06a91",
      "--pj-card-bg": "#ffffff",
      "--pj-card-border": "3px solid #ff8fc7",
      "--pj-card-radius": "28px",
      "--pj-card-shadow": "none",
      "--pj-btn-radius": "999px",
      "--pj-btn-border": "3px solid #6b2d5c",
      "--pj-btn-shadow": "none",
      "--pj-btn-hover-shadow": "none",
      "--pj-outline-bg": "#ffffff",
      "--pj-outline-ink": "#6b2d5c",
      "--pj-input-bg": "#fff5fa",
      "--pj-input-border": "2.5px solid #ffb3d9",
      "--pj-input-radius": "18px",
      "--pj-progress-bg": "#ffffff",
      "--pj-progress-border": "2.5px solid #6b2d5c",
      "--pj-pill-idle-bg": "#ffffff",
      "--pj-pill-idle-ink": "#c98fb5",
      "--pj-pill-idle-border": "2.5px solid #ffb3d9",
      "--pj-pill-active-bg": "#ff5fa2",
      "--pj-pill-active-ink": "#ffffff",
      "--pj-pill-shadow": "none",
      "--pj-logo-radius": "24px",
      "--pj-logo-border": "3px solid #ff8fc7",
      "--pj-coupon-bg": "#fff2f8",
      "--pj-font-display": `${FONT_DISPLAY_FALLBACK}`,
      "--pj-font-body": `${FONT_BODY_FALLBACK}`,
      "--pj-heading-transform": "none",
      "--pj-heading-spacing": "0",
    },
    wheel: {
      palette: ["#ffd1e8", "#ffe6a7", "#c3f0ca", "#b8e1ff", "#f7b6d2", "#dcc9ff"],
      stroke: "#ff8fc7",
      label: "#6b2d5c",
      rim: "#ff5fa2",
      hub: "#ffffff",
      hubDot: "#ff5fa2",
      pointer: "#6b2d5c",
      pointerInner: "#ff5fa2",
    },
  },

  // Minimal — Swiss editorial. Crisp mono-ish, big type, one bold accent.
  minimal: {
    id: "minimal",
    accent: "#4f46e5",
    fonts: [],
    vars: {
      "--pj-bg": "#f6f6f4",
      "--pj-bg-accent": "rgba(79,70,229,0.05)",
      "--pj-orb-1": "rgba(79,70,229,0.07)",
      "--pj-orb-2": "rgba(17,24,39,0.04)",
      "--pj-orb-3": "rgba(79,70,229,0.05)",
      "--pj-spark": "transparent",
      "--pj-glow": "rgba(79,70,229,0.18)",
      "--pj-ink": "#0f0f10",
      "--pj-muted": "#71717a",
      "--pj-card-bg": "#ffffff",
      "--pj-card-border": "1px solid #ececee",
      "--pj-card-radius": "20px",
      "--pj-card-shadow": "none",
      "--pj-btn-radius": "12px",
      "--pj-btn-border": "1px solid transparent",
      "--pj-btn-shadow": "none",
      "--pj-btn-hover-shadow": "none",
      "--pj-outline-bg": "#ffffff",
      "--pj-outline-ink": "#0f0f10",
      "--pj-input-bg": "#ffffff",
      "--pj-input-border": "1px solid #d4d4d8",
      "--pj-input-radius": "12px",
      "--pj-progress-bg": "#ededef",
      "--pj-progress-border": "1px solid #e4e4e7",
      "--pj-pill-idle-bg": "#f4f4f5",
      "--pj-pill-idle-ink": "#a1a1aa",
      "--pj-pill-idle-border": "1px solid #e4e4e7",
      "--pj-pill-active-bg": "#4f46e5",
      "--pj-pill-active-ink": "#ffffff",
      "--pj-pill-shadow": "none",
      "--pj-logo-radius": "14px",
      "--pj-logo-border": "1px solid #e4e4e7",
      "--pj-coupon-bg": "#fafafa",
      "--pj-font-display": `${FONT_DISPLAY_FALLBACK}`,
      "--pj-font-body": `${FONT_BODY_FALLBACK}`,
      "--pj-heading-transform": "none",
      "--pj-heading-spacing": "-0.03em",
    },
    wheel: {
      palette: ["#eef2ff", "#c7d2fe", "#a5b4fc", "#818cf8", "#e0e7ff", "#6366f1"],
      stroke: "#0f0f10",
      label: "#0f0f10",
      rim: "#4f46e5",
      hub: "#ffffff",
      hubDot: "#4f46e5",
      pointer: "#4f46e5",
      pointerInner: "#ffffff",
    },
  },
};

export interface ResolvedJourneyTheme {
  id: JourneyTemplateId;
  /** CSS custom properties to apply to `.public-flow` (includes resolved accent). */
  vars: Record<string, string>;
  wheel: WheelTheme;
  accent: string;
  accentInk: string;
}

function isTemplateId(value: unknown): value is JourneyTemplateId {
  return typeof value === "string" && (JOURNEY_TEMPLATE_IDS as string[]).includes(value);
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Defensive parse of the persisted jsonb (browser can write arbitrary data). */
export function parseJourneyTheme(raw: unknown): JourneyThemeConfig {
  const fallback: JourneyThemeConfig = {
    v: 1,
    template: DEFAULT_JOURNEY_TEMPLATE,
    accent: null,
  };
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  const template = isTemplateId(obj.template) ? obj.template : DEFAULT_JOURNEY_TEMPLATE;
  const accent =
    typeof obj.accent === "string" && HEX_RE.test(obj.accent.trim())
      ? obj.accent.trim()
      : null;
  return { v: 1, template, accent };
}

/** Resolve a template's tokens with an explicit accent override (no Merchant needed). */
function darkenHex(hex: string, amount: number): string {
  const m = hex.trim().match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return hex;
  let h = m[1]!;
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const f = 1 - amount;
  const r = Math.round(Number.parseInt(h.slice(0, 2), 16) * f);
  const g = Math.round(Number.parseInt(h.slice(2, 4), 16) * f);
  const b = Math.round(Number.parseInt(h.slice(4, 6), 16) * f);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function applyAccentToWheel(wheel: WheelTheme, accent: string): WheelTheme {
  const palette = wheel.palette.length > 0 ? [...wheel.palette] : [accent];
  palette[0] = accent;
  const pointerStroke = darkenHex(accent, 0.35);
  return {
    ...wheel,
    palette,
    rim: accent,
    hubDot: accent,
    pointer: pointerStroke,
    pointerInner: accent,
  };
}

export function resolveJourneyThemeById(
  template: JourneyTemplateId,
  accentOverride?: string | null,
  brandAccent?: string | null,
): ResolvedJourneyTheme {
  const def = JOURNEY_TEMPLATES[template] ?? JOURNEY_TEMPLATES[DEFAULT_JOURNEY_TEMPLATE];
  const override =
    accentOverride && HEX_RE.test(accentOverride.trim()) ? accentOverride.trim() : null;
  const brand =
    brandAccent && HEX_RE.test(brandAccent.trim()) ? brandAccent.trim() : null;
  const accent = override ?? (def.id === "pop" ? brand ?? def.accent : def.accent);
  const accentInk = contrastTextColor(accent);
  const wheel = applyAccentToWheel(def.wheel, accent);

  return {
    id: def.id,
    vars: {
      ...def.vars,
      "--pj-accent": accent,
      "--pj-accent-ink": accentInk,
      "--pj-pill-active-bg": accent,
      "--pj-pill-active-ink": accentInk,
      "--pj-progress-fill": accent,
      "--pj-glow": `color-mix(in srgb, ${accent} 42%, transparent)`,
      // Re-theme the existing Tailwind text-ink / text-muted utilities within the journey.
      "--ink": def.vars["--pj-ink"]!,
      "--muted": def.vars["--pj-muted"]!,
    },
    wheel,
    accent,
    accentInk,
  };
}

/** Merge a template's tokens with the merchant's chosen (or default) accent. */
export function resolveJourneyTheme(merchant: Merchant): ResolvedJourneyTheme {
  const config = parseJourneyTheme(merchant.journey_theme);
  return resolveJourneyThemeById(config.template, config.accent, merchant.primary_color);
}

/** Build the Google-fonts stylesheet URL for a template (null if none needed). */
export function journeyFontHref(template: JourneyTemplateId): string | null {
  const def = JOURNEY_TEMPLATES[template];
  if (!def || def.fonts.length === 0) return null;
  const families = def.fonts
    .map((f) => `family=${encodeURIComponent(f.family)}:${f.axis}`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/** All font hrefs (used by the dashboard picker + dev harness to preview every theme). */
export function allJourneyFontHrefs(): string[] {
  return JOURNEY_TEMPLATE_IDS.map((id) => journeyFontHref(id)).filter(
    (href): href is string => Boolean(href),
  );
}
