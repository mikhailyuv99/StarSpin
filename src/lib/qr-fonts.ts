export type QRFontCategory = "sans" | "serif" | "display" | "handwriting" | "monospace";

export type QRFontDefinition = {
  id: string;
  label: string;
  category: QRFontCategory;
  googleFamily: string;
  nameWeight: number;
  taglineWeight: number;
};

export const QR_FONT_CATEGORIES: { id: QRFontCategory; labelKey: string }[] = [
  { id: "sans", labelKey: "dashboard.qrFontCat_sans" },
  { id: "serif", labelKey: "dashboard.qrFontCat_serif" },
  { id: "display", labelKey: "dashboard.qrFontCat_display" },
  { id: "handwriting", labelKey: "dashboard.qrFontCat_handwriting" },
  { id: "monospace", labelKey: "dashboard.qrFontCat_monospace" },
];

/** 50 Google Fonts — 10 per category. */
export const QR_FONTS: QRFontDefinition[] = [
  // Sans serif — clean & modern
  { id: "inter", label: "Inter", category: "sans", googleFamily: "Inter", nameWeight: 800, taglineWeight: 600 },
  { id: "roboto", label: "Roboto", category: "sans", googleFamily: "Roboto", nameWeight: 900, taglineWeight: 500 },
  { id: "open-sans", label: "Open Sans", category: "sans", googleFamily: "Open Sans", nameWeight: 800, taglineWeight: 600 },
  { id: "lato", label: "Lato", category: "sans", googleFamily: "Lato", nameWeight: 900, taglineWeight: 700 },
  { id: "montserrat", label: "Montserrat", category: "sans", googleFamily: "Montserrat", nameWeight: 800, taglineWeight: 600 },
  { id: "poppins", label: "Poppins", category: "sans", googleFamily: "Poppins", nameWeight: 800, taglineWeight: 600 },
  { id: "raleway", label: "Raleway", category: "sans", googleFamily: "Raleway", nameWeight: 800, taglineWeight: 600 },
  { id: "work-sans", label: "Work Sans", category: "sans", googleFamily: "Work Sans", nameWeight: 800, taglineWeight: 600 },
  { id: "nunito", label: "Nunito", category: "sans", googleFamily: "Nunito", nameWeight: 800, taglineWeight: 700 },
  { id: "dm-sans", label: "DM Sans", category: "sans", googleFamily: "DM Sans", nameWeight: 800, taglineWeight: 600 },
  // Serif — elegant & classic
  { id: "playfair", label: "Playfair Display", category: "serif", googleFamily: "Playfair Display", nameWeight: 800, taglineWeight: 600 },
  { id: "merriweather", label: "Merriweather", category: "serif", googleFamily: "Merriweather", nameWeight: 900, taglineWeight: 700 },
  { id: "lora", label: "Lora", category: "serif", googleFamily: "Lora", nameWeight: 700, taglineWeight: 600 },
  { id: "libre-baskerville", label: "Libre Baskerville", category: "serif", googleFamily: "Libre Baskerville", nameWeight: 700, taglineWeight: 400 },
  { id: "crimson", label: "Crimson Text", category: "serif", googleFamily: "Crimson Text", nameWeight: 700, taglineWeight: 600 },
  { id: "source-serif", label: "Source Serif 4", category: "serif", googleFamily: "Source Serif 4", nameWeight: 700, taglineWeight: 600 },
  { id: "cormorant", label: "Cormorant Garamond", category: "serif", googleFamily: "Cormorant Garamond", nameWeight: 700, taglineWeight: 600 },
  { id: "eb-garamond", label: "EB Garamond", category: "serif", googleFamily: "EB Garamond", nameWeight: 800, taglineWeight: 600 },
  { id: "pt-serif", label: "PT Serif", category: "serif", googleFamily: "PT Serif", nameWeight: 700, taglineWeight: 400 },
  { id: "bitter", label: "Bitter", category: "serif", googleFamily: "Bitter", nameWeight: 800, taglineWeight: 600 },
  // Display — bold headlines
  { id: "bebas", label: "Bebas Neue", category: "display", googleFamily: "Bebas Neue", nameWeight: 400, taglineWeight: 400 },
  { id: "oswald", label: "Oswald", category: "display", googleFamily: "Oswald", nameWeight: 700, taglineWeight: 500 },
  { id: "anton", label: "Anton", category: "display", googleFamily: "Anton", nameWeight: 400, taglineWeight: 400 },
  { id: "alfa-slab", label: "Alfa Slab One", category: "display", googleFamily: "Alfa Slab One", nameWeight: 400, taglineWeight: 400 },
  { id: "bungee", label: "Bungee", category: "display", googleFamily: "Bungee", nameWeight: 400, taglineWeight: 400 },
  { id: "righteous", label: "Righteous", category: "display", googleFamily: "Righteous", nameWeight: 400, taglineWeight: 400 },
  { id: "passero", label: "Passero One", category: "display", googleFamily: "Passero One", nameWeight: 400, taglineWeight: 400 },
  { id: "russo", label: "Russo One", category: "display", googleFamily: "Russo One", nameWeight: 400, taglineWeight: 400 },
  { id: "black-ops", label: "Black Ops One", category: "display", googleFamily: "Black Ops One", nameWeight: 400, taglineWeight: 400 },
  { id: "teko", label: "Teko", category: "display", googleFamily: "Teko", nameWeight: 700, taglineWeight: 500 },
  // Handwriting — casual & personal
  { id: "pacifico", label: "Pacifico", category: "handwriting", googleFamily: "Pacifico", nameWeight: 400, taglineWeight: 400 },
  { id: "dancing-script", label: "Dancing Script", category: "handwriting", googleFamily: "Dancing Script", nameWeight: 700, taglineWeight: 600 },
  { id: "caveat", label: "Caveat", category: "handwriting", googleFamily: "Caveat", nameWeight: 700, taglineWeight: 600 },
  { id: "satisfy", label: "Satisfy", category: "handwriting", googleFamily: "Satisfy", nameWeight: 400, taglineWeight: 400 },
  { id: "great-vibes", label: "Great Vibes", category: "handwriting", googleFamily: "Great Vibes", nameWeight: 400, taglineWeight: 400 },
  { id: "indie-flower", label: "Indie Flower", category: "handwriting", googleFamily: "Indie Flower", nameWeight: 400, taglineWeight: 400 },
  { id: "shadow-light", label: "Shadows Into Light", category: "handwriting", googleFamily: "Shadows Into Light", nameWeight: 400, taglineWeight: 400 },
  { id: "kaushan", label: "Kaushan Script", category: "handwriting", googleFamily: "Kaushan Script", nameWeight: 400, taglineWeight: 400 },
  { id: "sacramento", label: "Sacramento", category: "handwriting", googleFamily: "Sacramento", nameWeight: 400, taglineWeight: 400 },
  { id: "marck", label: "Marck Script", category: "handwriting", googleFamily: "Marck Script", nameWeight: 400, taglineWeight: 400 },
  // Monospace — tech & minimal
  { id: "jetbrains-mono", label: "JetBrains Mono", category: "monospace", googleFamily: "JetBrains Mono", nameWeight: 800, taglineWeight: 600 },
  { id: "fira-code", label: "Fira Code", category: "monospace", googleFamily: "Fira Code", nameWeight: 700, taglineWeight: 500 },
  { id: "source-code", label: "Source Code Pro", category: "monospace", googleFamily: "Source Code Pro", nameWeight: 700, taglineWeight: 600 },
  { id: "ibm-plex-mono", label: "IBM Plex Mono", category: "monospace", googleFamily: "IBM Plex Mono", nameWeight: 700, taglineWeight: 500 },
  { id: "space-mono", label: "Space Mono", category: "monospace", googleFamily: "Space Mono", nameWeight: 700, taglineWeight: 400 },
  { id: "roboto-mono", label: "Roboto Mono", category: "monospace", googleFamily: "Roboto Mono", nameWeight: 700, taglineWeight: 500 },
  { id: "inconsolata", label: "Inconsolata", category: "monospace", googleFamily: "Inconsolata", nameWeight: 700, taglineWeight: 500 },
  { id: "ubuntu-mono", label: "Ubuntu Mono", category: "monospace", googleFamily: "Ubuntu Mono", nameWeight: 700, taglineWeight: 400 },
  { id: "courier-prime", label: "Courier Prime", category: "monospace", googleFamily: "Courier Prime", nameWeight: 700, taglineWeight: 400 },
  { id: "anonymous-pro", label: "Anonymous Pro", category: "monospace", googleFamily: "Anonymous Pro", nameWeight: 700, taglineWeight: 400 },
];

const FONT_MAP = new Map(QR_FONTS.map((f) => [f.id, f]));

export const DEFAULT_NAME_FONT_ID = "montserrat";
export const DEFAULT_TAGLINE_FONT_ID = "dm-sans";

export function getQRFont(id: string | undefined): QRFontDefinition {
  return FONT_MAP.get(id ?? "") ?? FONT_MAP.get(DEFAULT_NAME_FONT_ID)!;
}

export function isQRFontId(id: string): boolean {
  return FONT_MAP.has(id);
}

export function fontsByCategory(category: QRFontCategory): QRFontDefinition[] {
  return QR_FONTS.filter((f) => f.category === category);
}

const loadedFonts = new Set<string>();

function googleFontHref(family: string, weights: number[]): string {
  const familyParam = family.replace(/ /g, "+");
  const weightParam = [...new Set(weights)].sort((a, b) => a - b).join(";");
  return `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weightParam}&display=swap`;
}

export async function ensureQRFontLoaded(fontId: string, role: "name" | "tagline"): Promise<QRFontDefinition> {
  const font = getQRFont(fontId);
  const cacheKey = `${font.id}:${role}`;
  if (loadedFonts.has(cacheKey)) return font;

  const weight = role === "name" ? font.nameWeight : font.taglineWeight;
  const linkId = `qr-font-${font.id.replace(/[^a-z0-9-]/gi, "-")}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = googleFontHref(font.googleFamily, [font.nameWeight, font.taglineWeight]);
    document.head.appendChild(link);
  }

  try {
    await document.fonts.load(`${weight} 24px "${font.googleFamily}"`);
  } catch {
    await document.fonts.ready;
  }

  loadedFonts.add(cacheKey);
  return font;
}

export async function ensureQRFontsForRender(nameFontId: string, taglineFontId: string): Promise<void> {
  await Promise.all([
    ensureQRFontLoaded(nameFontId, "name"),
    ensureQRFontLoaded(taglineFontId, "tagline"),
  ]);
}

export function canvasFontString(font: QRFontDefinition, role: "name" | "tagline", sizePx: number): string {
  const weight = role === "name" ? font.nameWeight : font.taglineWeight;
  return `${weight} ${sizePx}px "${font.googleFamily}", system-ui, sans-serif`;
}
