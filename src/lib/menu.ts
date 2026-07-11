import type { Locale } from "@/i18n/config";
import { defaultLocale, locales } from "@/i18n/config";

export type MenuEntryMode = "off" | "hub" | "separate";
export type MenuVideoAspect = "16:9" | "9:16";

export type MenuNodeType =
  | "section"
  | "item"
  | "heading"
  | "text"
  | "divider"
  | "image"
  | "gallery"
  | "scan_page";

/** Localized string map for merchant-authored content. */
export type LocaleMap = Partial<Record<Locale, string>> & { en?: string };

export type MenuStyle = {
  accent?: string;
  density?: "comfortable" | "compact";
  priceAlign?: "right" | "inline";
  corners?: "sharp" | "rounded";
  /** Google font id from QR_FONTS / menu font catalog */
  font?: string;
};

export type MenuBackground = {
  /** Solid page fill (also shows under / beside a page image) */
  color?: string;
  /** Full-bleed hero banner at the top; fades into `color` */
  bannerUrl?: string | null;
  /** Optional full-page wallpaper (cover) behind the menu */
  pageImageUrl?: string | null;
  /** @deprecated use bannerUrl */
  imageUrl?: string | null;
};

export type MenuInfo = {
  hours?: LocaleMap;
  address?: LocaleMap;
  note?: LocaleMap;
};

export type MenuNodePayload = {
  title?: LocaleMap;
  description?: LocaleMap;
  name?: LocaleMap;
  body?: LocaleMap;
  price?: string;
  currency?: string;
  tags?: string[];
  photo_urls?: string[];
  video_url?: string | null;
  video_aspect?: MenuVideoAspect | null;
  available?: boolean;
  image_url?: string | null;
  image_urls?: string[];
  alt?: LocaleMap;
};

export type MenuNode = {
  id: string;
  merchant_id: string;
  position: number;
  type: MenuNodeType;
  visible: boolean;
  section_id: string | null;
  payload: MenuNodePayload;
  created_at?: string;
  updated_at?: string;
};

export type MenuCatalogEntry = {
  id: string;
  type: MenuNodeType;
  group: "structure" | "dishes" | "media";
  labelKey: string;
  withPhoto?: boolean;
};

export const MENU_CATALOG: MenuCatalogEntry[] = [
  { id: "section", type: "section", group: "structure", labelKey: "menuStudio.catalogSection" },
  { id: "divider", type: "divider", group: "structure", labelKey: "menuStudio.catalogDivider" },
  { id: "heading", type: "heading", group: "structure", labelKey: "menuStudio.catalogHeading" },
  { id: "text", type: "text", group: "structure", labelKey: "menuStudio.catalogText" },
  { id: "item", type: "item", group: "dishes", labelKey: "menuStudio.catalogItem" },
  { id: "image", type: "image", group: "media", labelKey: "menuStudio.catalogImage" },
  { id: "gallery", type: "gallery", group: "media", labelKey: "menuStudio.catalogGallery" },
  { id: "scan_page", type: "scan_page", group: "media", labelKey: "menuStudio.catalogScanPage" },
];

export const MENU_CURRENCIES = [
  { id: "EUR", symbol: "€", labelKey: "menuStudio.currencyEur" },
  { id: "USD", symbol: "$", labelKey: "menuStudio.currencyUsd" },
  { id: "VND", symbol: "₫", labelKey: "menuStudio.currencyVnd" },
  { id: "GBP", symbol: "£", labelKey: "menuStudio.currencyGbp" },
  { id: "RUB", symbol: "₽", labelKey: "menuStudio.currencyRub" },
] as const;

export type MenuCurrencyId = (typeof MENU_CURRENCIES)[number]["id"];

export function currencySymbol(idOrSymbol: string | undefined | null): string {
  if (!idOrSymbol) return "€";
  const byId = MENU_CURRENCIES.find((c) => c.id === idOrSymbol);
  if (byId) return byId.symbol;
  const bySymbol = MENU_CURRENCIES.find((c) => c.symbol === idOrSymbol);
  return bySymbol?.symbol ?? idOrSymbol;
}

export const DEFAULT_MENU_STYLE: Required<MenuStyle> = {
  accent: "#E85D04",
  density: "comfortable",
  priceAlign: "right",
  corners: "rounded",
  font: "montserrat",
};

export const DEFAULT_MENU_BACKGROUND: Required<Pick<MenuBackground, "color">> & {
  bannerUrl: string | null;
  pageImageUrl: string | null;
} = {
  color: "#FFF8F1",
  bannerUrl: null,
  pageImageUrl: null,
};

export const MAX_DISH_PHOTOS = 3;
export const MAX_VIDEO_SECONDS = 15;
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

export function emptyLocaleMap(value = "", locale: Locale = defaultLocale): LocaleMap {
  return { [locale]: value };
}

export function resolveLocaleMap(
  map: LocaleMap | undefined | null,
  locale: Locale,
  fallback = "",
): string {
  if (!map) return fallback;
  const direct = map[locale];
  if (typeof direct === "string" && direct.length > 0) return direct;
  const en = map.en;
  if (typeof en === "string" && en.length > 0) return en;
  for (const loc of locales) {
    const v = map[loc];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return fallback;
}

/** Best non-empty source locale for translation (prefer `prefer`, then en, then any). */
export function pickLocaleMapSource(
  map: LocaleMap | undefined | null,
  prefer?: Locale,
): { locale: Locale; text: string } | null {
  if (!map) return null;
  const order: Locale[] = [
    ...(prefer ? [prefer] : []),
    defaultLocale,
    ...locales.filter((l) => l !== prefer && l !== defaultLocale),
  ];
  const seen = new Set<Locale>();
  for (const loc of order) {
    if (seen.has(loc)) continue;
    seen.add(loc);
    const text = map[loc];
    if (typeof text === "string" && text.trim().length > 0) {
      return { locale: loc, text };
    }
  }
  return null;
}

/** Editor value for the active UI locale only — no cross-locale fallback. */
export function localeMapDraft(
  map: LocaleMap | undefined | null,
  locale: Locale,
): string {
  if (!map) return "";
  if (typeof map[locale] === "string") return map[locale] as string;
  return "";
}

export function parseMenuEntryMode(value: unknown): MenuEntryMode {
  if (value === "hub" || value === "separate" || value === "off") return value;
  return "off";
}

export function parseMenuStyle(value: unknown, primaryColor?: string): MenuStyle {
  const raw = (value && typeof value === "object" ? value : {}) as MenuStyle & {
    font?: string;
  };
  const legacyFont =
    raw.font === "sans"
      ? "montserrat"
      : raw.font === "serif"
        ? "playfair"
        : raw.font === "display"
          ? "bebas"
          : raw.font;
  return {
    ...DEFAULT_MENU_STYLE,
    accent: primaryColor || DEFAULT_MENU_STYLE.accent,
    ...raw,
    font: legacyFont || DEFAULT_MENU_STYLE.font,
  };
}

export function parseMenuBackground(value: unknown): MenuBackground {
  const raw = (value && typeof value === "object" ? value : {}) as MenuBackground;
  const bannerUrl = raw.bannerUrl ?? raw.imageUrl ?? null;
  const pageImageUrl =
    typeof raw.pageImageUrl === "string" && raw.pageImageUrl.length > 0
      ? raw.pageImageUrl
      : null;
  return {
    color: raw.color || DEFAULT_MENU_BACKGROUND.color,
    bannerUrl,
    pageImageUrl,
    imageUrl: bannerUrl,
  };
}

export function parseMenuInfo(value: unknown): MenuInfo {
  if (!value || typeof value !== "object") return {};
  return value as MenuInfo;
}

export function defaultPayloadForType(
  type: MenuNodeType,
  opts?: {
    withPhoto?: boolean;
    labels?: Partial<Record<MenuNodeType | "itemPhoto", string>>;
    locale?: Locale;
  },
): MenuNodePayload {
  const L = opts?.labels ?? {};
  const loc = opts?.locale ?? defaultLocale;
  switch (type) {
    case "section":
      return {
        title: emptyLocaleMap(L.section ?? "New section", loc),
        description: emptyLocaleMap("", loc),
      };
    case "item":
      return {
        name: emptyLocaleMap(
          opts?.withPhoto ? (L.itemPhoto ?? L.item ?? "New dish") : (L.item ?? "New dish"),
          loc,
        ),
        description: emptyLocaleMap("", loc),
        price: "",
        currency: "EUR",
        tags: [],
        photo_urls: [],
        video_url: null,
        video_aspect: null,
        available: true,
      };
    case "heading":
      return { title: emptyLocaleMap(L.heading ?? "Heading", loc) };
    case "text":
      return { body: emptyLocaleMap(L.text ?? "Note", loc) };
    case "divider":
      return {};
    case "image":
      return { image_url: null, alt: emptyLocaleMap("", loc) };
    case "gallery":
      return { image_urls: [], alt: emptyLocaleMap("", loc) };
    case "scan_page":
      return { image_url: null, alt: emptyLocaleMap(L.scan_page ?? "Menu page", loc) };
    default:
      return {};
  }
}

export function sortMenuNodes(nodes: MenuNode[]): MenuNode[] {
  return [...nodes].sort((a, b) => a.position - b.position);
}

/** Top-level stream order: sections and non-item blocks; items nest under section_id. */
export function groupMenuNodes(nodes: MenuNode[]): {
  roots: MenuNode[];
  itemsBySection: Record<string, MenuNode[]>;
} {
  const sorted = sortMenuNodes(nodes);
  const itemsBySection: Record<string, MenuNode[]> = {};
  const roots: MenuNode[] = [];
  for (const node of sorted) {
    if (node.type === "item" && node.section_id) {
      if (!itemsBySection[node.section_id]) itemsBySection[node.section_id] = [];
      itemsBySection[node.section_id].push(node);
    } else {
      roots.push(node);
    }
  }
  return { roots, itemsBySection };
}

export function reindexPositions(nodes: MenuNode[]): MenuNode[] {
  return sortMenuNodes(nodes).map((n, i) => ({ ...n, position: i }));
}

export function newClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function aspectNear(ratio: number, target: number, tolerance = 0.18): boolean {
  return Math.abs(ratio - target) <= tolerance;
}

export function classifyVideoAspect(width: number, height: number): MenuVideoAspect | null {
  if (!width || !height) return null;
  const r = width / height;
  if (aspectNear(r, 16 / 9)) return "16:9";
  if (aspectNear(r, 9 / 16)) return "9:16";
  return null;
}
