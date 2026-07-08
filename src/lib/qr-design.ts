import QRCode from "qrcode";
import {
  canvasFontString,
  DEFAULT_NAME_FONT_ID,
  ensureQRFontsForRender,
  getQRFont,
  isQRFontId,
} from "@/lib/qr-fonts";

export type QRDesignTemplate = "qr" | "table_sticker" | "visit_card";
export type VisitCardSide = "front" | "back";

export type ElementPlacement = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  /** Stacking order. Higher = in front. Undefined falls back to sensible defaults. */
  z?: number;
};

export type TextBox = {
  id: string;
  text: string;
  fontId: string;
  color: string;
  placement: ElementPlacement;
};

export type LibraryImage = {
  id: string;
  url: string;
  aspectRatio: number;
};

export type PlacedImage = {
  id: string;
  libraryId: string;
  url: string;
  aspectRatio: number;
  placement: ElementPlacement;
};

export const BUSINESS_LOGO_ID = "business";

export type SideDesign = {
  layoutBg: string;
  qr: ElementPlacement;
  textBoxes: TextBox[];
  images: PlacedImage[];
};

export type QRDesignConfig = {
  v: 3;
  template: QRDesignTemplate;
  imageLibrary: LibraryImage[];
  sticker: SideDesign;
  visitCard: { front: SideDesign; back: SideDesign };
};

export type SelectedElement =
  | { kind: "qr" }
  | { kind: "image"; id: string }
  | { kind: "text"; id: string };

export type ElementBounds = { x: number; y: number; w: number; h: number; rotation: number };

export const CANVAS_SIZE: Record<QRDesignTemplate, { width: number; height: number }> = {
  qr: { width: 512, height: 512 },
  table_sticker: { width: 900, height: 900 },
  visit_card: { width: 1050, height: 600 },
};

export const PREVIEW_MAX_WIDTH: Record<QRDesignTemplate, number> = {
  qr: 300,
  table_sticker: 360,
  visit_card: 420,
};

export function previewPixelSize(template: QRDesignTemplate): { width: number; height: number } {
  const width = PREVIEW_MAX_WIDTH[template];
  const canvas = CANVAS_SIZE[template];
  return {
    width,
    height: Math.round(canvas.height * (width / canvas.width)),
  };
}

export const ALIGNMENT_GRID = [0.25, 0.5, 0.75] as const;
const SNAP_THRESHOLD = 0.04;
const MIN_SCALE = 0.05;

const BASE: Record<Exclude<QRDesignTemplate, "qr">, { logo: number; qr: number; text: number }> = {
  table_sticker: { logo: 130, qr: 400, text: 36 },
  visit_card: { logo: 110, qr: 300, text: 28 },
};

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
export const RESIZE_HANDLE_SIZE = 14;
export const RESIZE_HANDLE_HIT = 22;
export const ROTATION_HANDLE_OFFSET = 36;
export const ROTATION_HANDLE_HIT = 26;
const ROTATION_SNAP_THRESHOLD = 8;
const ROTATION_SNAPS = [0, 90, 180, 270] as const;

export function snapRotation(rotation: number): number {
  const normalized = ((rotation % 360) + 360) % 360;
  for (const snap of ROTATION_SNAPS) {
    if (Math.abs(normalized - snap) < ROTATION_SNAP_THRESHOLD) return snap;
  }
  if (normalized > 360 - ROTATION_SNAP_THRESHOLD) return 0;
  return rotation;
}

export function elementKey(ref: SelectedElement): string {
  if (ref.kind === "text") return `text:${ref.id}`;
  if (ref.kind === "image") return `image:${ref.id}`;
  return ref.kind;
}

export function snapToAlignmentGrid(x: number, y: number): { x: number; y: number } {
  const snapAxis = (value: number) => {
    for (const line of ALIGNMENT_GRID) {
      if (Math.abs(value - line) < SNAP_THRESHOLD) return line;
    }
    return value;
  };
  return { x: snapAxis(x), y: snapAxis(y) };
}

export function normalizeHex(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed;
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed}`;
  return fallback;
}

export function clampPlacement(placement: ElementPlacement): ElementPlacement {
  const next: ElementPlacement = {
    x: Math.min(0.98, Math.max(0.02, placement.x)),
    y: Math.min(0.98, Math.max(0.02, placement.y)),
    scale: Math.max(MIN_SCALE, placement.scale),
    rotation: ((placement.rotation % 360) + 360) % 360,
  };
  if (placement.z !== undefined) next.z = placement.z;
  return next;
}

/** Default stacking so legacy designs keep images-below-QR-below-text order. */
const DEFAULT_QR_Z = 1000;
const DEFAULT_TEXT_Z = 2000;

export type LayerEntry = {
  ref: SelectedElement;
  placement: ElementPlacement;
  z: number;
};

/** All placeable elements on a side, sorted back-to-front (ascending z). */
export function getSideLayers(side: SideDesign): LayerEntry[] {
  const entries: LayerEntry[] = [];
  side.images.forEach((img, i) =>
    entries.push({ ref: { kind: "image", id: img.id }, placement: img.placement, z: img.placement.z ?? i + 1 }),
  );
  entries.push({ ref: { kind: "qr" }, placement: side.qr, z: side.qr.z ?? DEFAULT_QR_Z });
  side.textBoxes.forEach((box, i) =>
    entries.push({ ref: { kind: "text", id: box.id }, placement: box.placement, z: box.placement.z ?? DEFAULT_TEXT_Z + i }),
  );
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => a.entry.z - b.entry.z || a.index - b.index)
    .map(({ entry }) => entry);
}

export type LayerAction = "front" | "back" | "forward" | "backward";

function defaultQrPlacement(template: Exclude<QRDesignTemplate, "qr">): ElementPlacement {
  return { x: 0.5, y: 0.5, scale: 1, rotation: 0 };
}

export function blankSideDesign(template: Exclude<QRDesignTemplate, "qr">): SideDesign {
  return {
    layoutBg: "#ffffff",
    qr: defaultQrPlacement(template),
    textBoxes: [],
    images: [],
  };
}

export function createPlacedImage(
  libraryId: string,
  url: string,
  aspectRatio = 1,
  placement?: Partial<ElementPlacement>,
): PlacedImage {
  return {
    id: crypto.randomUUID(),
    libraryId,
    url,
    aspectRatio: normalizeAspectRatio(aspectRatio),
    placement: clampPlacement({
      x: 0.5,
      y: 0.28,
      scale: 0.75,
      rotation: 0,
      ...placement,
    }),
  };
}

export function createLibraryImage(url: string, aspectRatio = 1): LibraryImage {
  return { id: crypto.randomUUID(), url, aspectRatio: normalizeAspectRatio(aspectRatio) };
}

export function normalizeAspectRatio(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return value;
}

export function readImageAspectRatio(url: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(normalizeAspectRatio(img.naturalWidth / img.naturalHeight));
    img.onerror = () => resolve(1);
    img.src = url;
  });
}

export function readImageAspectRatioFromFile(file: File): Promise<number> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(normalizeAspectRatio(img.naturalWidth / img.naturalHeight));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(1);
    };
    img.src = objectUrl;
  });
}

export function imageDisplaySize(
  template: Exclude<QRDesignTemplate, "qr">,
  scale: number,
  aspectRatio: number,
): { width: number; height: number } {
  const base = scaledSize(template, "logo", scale);
  const ratio = normalizeAspectRatio(aspectRatio);
  if (ratio >= 1) return { width: base * ratio, height: base };
  return { width: base, height: base / ratio };
}

export function resolveLibraryAspectRatio(
  design: QRDesignConfig,
  libraryId: string,
  businessLogoAspectRatio = 1,
): number {
  if (libraryId === BUSINESS_LOGO_ID) return normalizeAspectRatio(businessLogoAspectRatio);
  return normalizeAspectRatio(
    design.imageLibrary.find((img) => img.id === libraryId)?.aspectRatio ?? 1,
  );
}

export function createTextBox(text = "Text"): TextBox {
  return {
    id: crypto.randomUUID(),
    text,
    fontId: DEFAULT_NAME_FONT_ID,
    color: "#0a0a0a",
    placement: { x: 0.5, y: 0.72, scale: 1, rotation: 0 },
  };
}

export function defaultQRDesign(_merchant: { logo_url?: string | null }): QRDesignConfig {
  return {
    v: 3,
    template: "table_sticker",
    imageLibrary: [],
    sticker: blankSideDesign("table_sticker"),
    visitCard: {
      front: blankSideDesign("visit_card"),
      back: blankSideDesign("visit_card"),
    },
  };
}

function parsePlacement(raw: unknown, fallback: ElementPlacement): ElementPlacement {
  if (!raw || typeof raw !== "object") return { ...fallback };
  const data = raw as Record<string, unknown>;
  return clampPlacement({
    x: typeof data.x === "number" ? data.x : fallback.x,
    y: typeof data.y === "number" ? data.y : fallback.y,
    scale: typeof data.scale === "number" ? data.scale : fallback.scale,
    rotation: typeof data.rotation === "number" ? data.rotation : fallback.rotation,
    ...(typeof data.z === "number" ? { z: data.z } : {}),
  });
}

function parseTextBox(raw: unknown, fallback: TextBox): TextBox {
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;
  return {
    id: typeof data.id === "string" ? data.id : fallback.id,
    text: typeof data.text === "string" ? data.text : fallback.text,
    fontId: typeof data.fontId === "string" && isQRFontId(data.fontId) ? data.fontId : fallback.fontId,
    color: typeof data.color === "string" ? normalizeHex(data.color, fallback.color) : fallback.color,
    placement: parsePlacement(data.placement, fallback.placement),
  };
}

function parsePlacedImage(raw: unknown, fallback: PlacedImage): PlacedImage {
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;
  return {
    id: typeof data.id === "string" ? data.id : fallback.id,
    libraryId: typeof data.libraryId === "string" ? data.libraryId : fallback.libraryId,
    url: typeof data.url === "string" ? data.url : fallback.url,
    aspectRatio:
      typeof data.aspectRatio === "number"
        ? normalizeAspectRatio(data.aspectRatio)
        : fallback.aspectRatio,
    placement: parsePlacement(data.placement, fallback.placement),
  };
}

function parseLibraryImage(raw: unknown, fallback: LibraryImage): LibraryImage {
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;
  return {
    id: typeof data.id === "string" ? data.id : fallback.id,
    url: typeof data.url === "string" ? data.url : fallback.url,
    aspectRatio:
      typeof data.aspectRatio === "number"
        ? normalizeAspectRatio(data.aspectRatio)
        : fallback.aspectRatio,
  };
}

function parseSideDesign(raw: unknown, template: Exclude<QRDesignTemplate, "qr">): SideDesign {
  const fallback = blankSideDesign(template);
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;
  const textBoxesRaw = Array.isArray(data.textBoxes) ? data.textBoxes : [];
  const imagesRaw = Array.isArray(data.images) ? data.images : [];
  return {
    layoutBg:
      typeof data.layoutBg === "string" ? normalizeHex(data.layoutBg, fallback.layoutBg) : fallback.layoutBg,
    qr: parsePlacement(data.qr, fallback.qr),
    textBoxes: textBoxesRaw.map((item, i) =>
      parseTextBox(item, fallback.textBoxes[i] ?? createTextBox()),
    ),
    images: imagesRaw.map((item, i) =>
      parsePlacedImage(item, fallback.images[i] ?? createPlacedImage(BUSINESS_LOGO_ID, "", 1)),
    ).filter((img) => img.url),
  };
}

type LegacySideDesign = SideDesign & {
  showLogo?: boolean;
  logo?: ElementPlacement;
};

function migrateV2Side(
  raw: unknown,
  template: Exclude<QRDesignTemplate, "qr">,
  logoUrl: string | null,
): SideDesign {
  const side = parseSideDesign(raw, template) as LegacySideDesign;
  if (!raw || typeof raw !== "object") return side;
  const data = raw as Record<string, unknown>;
  const images = [...side.images];
  const showLogo = data.showLogo === true;
  const legacyLogo = parsePlacement(data.logo, { x: 0.5, y: 0.22, scale: 0.75, rotation: 0 });
  if (showLogo && logoUrl && !images.some((img) => img.url === logoUrl)) {
    images.push(createPlacedImage(BUSINESS_LOGO_ID, logoUrl, 1, legacyLogo));
  }
  return { ...side, images };
}

function parseImageLibrary(raw: unknown): LibraryImage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i) => parseLibraryImage(item, { id: `lib-${i}`, url: "", aspectRatio: 1 }))
    .filter((img) => img.url);
}

export function parseQRDesign(
  raw: unknown,
  merchant: { logo_url?: string | null },
): QRDesignConfig {
  const base = defaultQRDesign(merchant);
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Record<string, unknown>;

  const template =
    data.template === "qr" || data.template === "table_sticker" || data.template === "visit_card"
      ? data.template
      : base.template;

  const legacyLogoUrl =
    typeof data.logoUrl === "string" && data.logoUrl.trim()
      ? data.logoUrl
      : merchant.logo_url ?? null;

  if (data.v === 3) {
    const visitRaw =
      data.visitCard && typeof data.visitCard === "object"
        ? (data.visitCard as Record<string, unknown>)
        : {};
    return {
      v: 3,
      template,
      imageLibrary: parseImageLibrary(data.imageLibrary),
      sticker: parseSideDesign(data.sticker, "table_sticker"),
      visitCard: {
        front: parseSideDesign(visitRaw.front, "visit_card"),
        back: parseSideDesign(visitRaw.back, "visit_card"),
      },
    };
  }

  if (data.v === 2) {
    const visitRaw =
      data.visitCard && typeof data.visitCard === "object"
        ? (data.visitCard as Record<string, unknown>)
        : {};
    const imageLibrary = parseImageLibrary(data.imageLibrary);
    if (
      legacyLogoUrl &&
      !imageLibrary.some((img) => img.url === legacyLogoUrl) &&
      legacyLogoUrl !== merchant.logo_url
    ) {
      imageLibrary.unshift(createLibraryImage(legacyLogoUrl));
    }
    return {
      v: 3,
      template,
      imageLibrary,
      sticker: migrateV2Side(data.sticker, "table_sticker", legacyLogoUrl),
      visitCard: {
        front: migrateV2Side(visitRaw.front, "visit_card", legacyLogoUrl),
        back: migrateV2Side(visitRaw.back, "visit_card", legacyLogoUrl),
      },
    };
  }

  return { ...base, template };
}

export function getSideDesign(
  design: QRDesignConfig,
  template: Exclude<QRDesignTemplate, "qr">,
  visitCardSide: VisitCardSide = "front",
): SideDesign {
  if (template === "table_sticker") return design.sticker;
  return design.visitCard[visitCardSide];
}

export function patchSideDesign(
  design: QRDesignConfig,
  template: Exclude<QRDesignTemplate, "qr">,
  visitCardSide: VisitCardSide,
  patch: Partial<SideDesign>,
): QRDesignConfig {
  if (template === "table_sticker") {
    return { ...design, sticker: { ...design.sticker, ...patch } };
  }
  return {
    ...design,
    visitCard: {
      ...design.visitCard,
      [visitCardSide]: { ...design.visitCard[visitCardSide], ...patch },
    },
  };
}

export function patchElementPlacement(
  design: QRDesignConfig,
  template: Exclude<QRDesignTemplate, "qr">,
  visitCardSide: VisitCardSide,
  kind: "qr",
  patch: Partial<ElementPlacement>,
): QRDesignConfig {
  const side = getSideDesign(design, template, visitCardSide);
  const current = side.qr;
  return patchSideDesign(design, template, visitCardSide, {
    qr: clampPlacement({ ...current, ...patch }),
  });
}

export type ImagePatch = Partial<Omit<PlacedImage, "id" | "placement">> & {
  placement?: Partial<ElementPlacement>;
};

export function patchImage(
  design: QRDesignConfig,
  template: Exclude<QRDesignTemplate, "qr">,
  visitCardSide: VisitCardSide,
  id: string,
  patch: ImagePatch,
): QRDesignConfig {
  const side = getSideDesign(design, template, visitCardSide);
  return patchSideDesign(design, template, visitCardSide, {
    images: side.images.map((img) => {
      if (img.id !== id) return img;
      return {
        ...img,
        ...patch,
        placement: patch.placement
          ? clampPlacement({ ...img.placement, ...patch.placement })
          : img.placement,
      };
    }),
  });
}

export function addImage(
  design: QRDesignConfig,
  template: Exclude<QRDesignTemplate, "qr">,
  visitCardSide: VisitCardSide,
  image: PlacedImage,
): QRDesignConfig {
  const side = getSideDesign(design, template, visitCardSide);
  return patchSideDesign(design, template, visitCardSide, {
    images: [...side.images, image],
  });
}

export function removeImage(
  design: QRDesignConfig,
  template: Exclude<QRDesignTemplate, "qr">,
  visitCardSide: VisitCardSide,
  id: string,
): QRDesignConfig {
  const side = getSideDesign(design, template, visitCardSide);
  return patchSideDesign(design, template, visitCardSide, {
    images: side.images.filter((img) => img.id !== id),
  });
}

export function addLibraryImage(design: QRDesignConfig, image: LibraryImage): QRDesignConfig {
  if (design.imageLibrary.some((item) => item.url === image.url)) return design;
  return { ...design, imageLibrary: [...design.imageLibrary, image] };
}

export function removeLibraryImage(design: QRDesignConfig, libraryId: string): QRDesignConfig {
  const stripSide = (side: SideDesign): SideDesign => ({
    ...side,
    images: side.images.filter((img) => img.libraryId !== libraryId),
  });
  return {
    ...design,
    imageLibrary: design.imageLibrary.filter((img) => img.id !== libraryId),
    sticker: stripSide(design.sticker),
    visitCard: {
      front: stripSide(design.visitCard.front),
      back: stripSide(design.visitCard.back),
    },
  };
}

export type TextBoxPatch = Partial<Omit<TextBox, "id" | "placement">> & {
  placement?: Partial<ElementPlacement>;
};

export function patchTextBox(
  design: QRDesignConfig,
  template: Exclude<QRDesignTemplate, "qr">,
  visitCardSide: VisitCardSide,
  id: string,
  patch: TextBoxPatch,
): QRDesignConfig {
  const side = getSideDesign(design, template, visitCardSide);
  return patchSideDesign(design, template, visitCardSide, {
    textBoxes: side.textBoxes.map((box) => {
      if (box.id !== id) return box;
      return {
        ...box,
        ...patch,
        placement: patch.placement
          ? clampPlacement({ ...box.placement, ...patch.placement })
          : box.placement,
      };
    }),
  });
}

export function addTextBox(
  design: QRDesignConfig,
  template: Exclude<QRDesignTemplate, "qr">,
  visitCardSide: VisitCardSide,
  box: TextBox = createTextBox(),
): QRDesignConfig {
  const side = getSideDesign(design, template, visitCardSide);
  return patchSideDesign(design, template, visitCardSide, {
    textBoxes: [...side.textBoxes, box],
  });
}

export function removeTextBox(
  design: QRDesignConfig,
  template: Exclude<QRDesignTemplate, "qr">,
  visitCardSide: VisitCardSide,
  id: string,
): QRDesignConfig {
  const side = getSideDesign(design, template, visitCardSide);
  return patchSideDesign(design, template, visitCardSide, {
    textBoxes: side.textBoxes.filter((box) => box.id !== id),
  });
}

function patchLayerZ(
  design: QRDesignConfig,
  template: Exclude<QRDesignTemplate, "qr">,
  visitCardSide: VisitCardSide,
  ref: SelectedElement,
  z: number,
): QRDesignConfig {
  if (ref.kind === "qr") {
    return patchElementPlacement(design, template, visitCardSide, "qr", { z });
  }
  if (ref.kind === "image") {
    return patchImage(design, template, visitCardSide, ref.id, { placement: { z } });
  }
  return patchTextBox(design, template, visitCardSide, ref.id, { placement: { z } });
}

/** Move an element within the stacking order (Canva-style bring forward / send back). */
export function reorderLayer(
  design: QRDesignConfig,
  template: Exclude<QRDesignTemplate, "qr">,
  visitCardSide: VisitCardSide,
  ref: SelectedElement,
  action: LayerAction,
): QRDesignConfig {
  const side = getSideDesign(design, template, visitCardSide);
  const order = getSideLayers(side).map((entry) => entry.ref);
  const index = order.findIndex((item) => elementKey(item) === elementKey(ref));
  if (index < 0) return design;

  const [item] = order.splice(index, 1);
  let target = index;
  if (action === "front") target = order.length;
  else if (action === "back") target = 0;
  else if (action === "forward") target = Math.min(order.length, index + 1);
  else if (action === "backward") target = Math.max(0, index - 1);
  order.splice(target, 0, item);

  // Bake the resulting order into explicit, evenly-spaced z values.
  let result = design;
  order.forEach((entryRef, i) => {
    result = patchLayerZ(result, template, visitCardSide, entryRef, (i + 1) * 10);
  });
  return result;
}

export function canMoveLayer(
  side: SideDesign,
  ref: SelectedElement,
  action: LayerAction,
): boolean {
  const order = getSideLayers(side).map((entry) => entry.ref);
  const index = order.findIndex((item) => elementKey(item) === elementKey(ref));
  if (index < 0) return false;
  if (action === "front" || action === "forward") return index < order.length - 1;
  return index > 0;
}

function scaledSize(
  template: Exclude<QRDesignTemplate, "qr">,
  kind: "logo" | "qr" | "text",
  scale: number,
): number {
  return BASE[template][kind] * scale;
}

function measureTextBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  maxWidth: number,
  fontFamily: string,
  weight: number,
): { width: number; height: number; lines: string[] } {
  ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const width = Math.max(...lines.map((l) => ctx.measureText(l).width), 0);
  const lineHeight = fontSize * 1.25;
  return { width, height: lines.length * lineHeight, lines };
}

function placementToBounds(
  placement: ElementPlacement,
  w: number,
  h: number,
  canvasWidth: number,
  canvasHeight: number,
): ElementBounds {
  return {
    x: placement.x * canvasWidth - w / 2,
    y: placement.y * canvasHeight - h / 2,
    w,
    h,
    rotation: placement.rotation,
  };
}

export function computeElementBounds(
  template: Exclude<QRDesignTemplate, "qr">,
  side: SideDesign,
  canvasWidth: number,
  canvasHeight: number,
): Record<string, ElementBounds> {
  const bounds: Record<string, ElementBounds> = {};
  const scratch = document.createElement("canvas");
  const c = scratch.getContext("2d");
  if (!c) return bounds;

  bounds.qr = placementToBounds(
    side.qr,
    scaledSize(template, "qr", side.qr.scale),
    scaledSize(template, "qr", side.qr.scale),
    canvasWidth,
    canvasHeight,
  );

  for (const img of side.images) {
    const { width, height } = imageDisplaySize(template, img.placement.scale, img.aspectRatio);
    bounds[`image:${img.id}`] = placementToBounds(
      img.placement,
      width,
      height,
      canvasWidth,
      canvasHeight,
    );
  }

  for (const box of side.textBoxes) {
    const fontSize = scaledSize(template, "text", box.placement.scale);
    const font = getQRFont(box.fontId);
    const block = measureTextBlock(
      c,
      box.text,
      fontSize,
      canvasWidth * 0.9,
      `"${font.googleFamily}", system-ui, sans-serif`,
      font.nameWeight,
    );
    bounds[`text:${box.id}`] = placementToBounds(
      box.placement,
      Math.max(block.width, 40),
      Math.max(block.height, fontSize),
      canvasWidth,
      canvasHeight,
    );
  }

  return bounds;
}

function pointInRotatedRect(
  px: number,
  py: number,
  box: ElementBounds,
): boolean {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const rad = (-box.rotation * Math.PI) / 180;
  const dx = px - cx;
  const dy = py - cy;
  const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
  const localY = dx * Math.sin(rad) + dy * Math.cos(rad);
  return localX >= -box.w / 2 && localX <= box.w / 2 && localY >= -box.h / 2 && localY <= box.h / 2;
}

function refFromKey(key: string): SelectedElement {
  if (key === "qr") return { kind: "qr" };
  if (key.startsWith("image:")) return { kind: "image", id: key.slice(6) };
  return { kind: "text", id: key.slice(5) };
}

/**
 * All elements under a point, ordered front-to-back using the real stacking order
 * so hit-testing matches what's drawn. Used for tap-to-cycle through overlaps.
 */
export function hitTestElementsOrdered(
  px: number,
  py: number,
  side: SideDesign,
  bounds: Record<string, ElementBounds>,
): SelectedElement[] {
  const frontToBack = getSideLayers(side).slice().reverse();
  const hits: SelectedElement[] = [];
  for (const entry of frontToBack) {
    const box = bounds[elementKey(entry.ref)];
    if (box && pointInRotatedRect(px, py, box)) hits.push(entry.ref);
  }
  return hits;
}

export function hitTestElement(
  px: number,
  py: number,
  bounds: Record<string, ElementBounds>,
): SelectedElement | null {
  const order = Object.keys(bounds).sort((a, b) => {
    const priority = (key: string) => {
      if (key.startsWith("text:")) return 3;
      if (key.startsWith("image:")) return 2;
      return 1;
    };
    return priority(b) - priority(a);
  });

  for (const key of order) {
    const box = bounds[key];
    if (pointInRotatedRect(px, py, box)) return refFromKey(key);
  }
  return null;
}

export function getResizeHandlePositions(
  bounds: ElementBounds,
  size = RESIZE_HANDLE_SIZE,
): Record<ResizeHandle, { x: number; y: number }> {
  const { x, y, w, h, rotation } = bounds;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const localHandles: Record<ResizeHandle, { lx: number; ly: number }> = {
    nw: { lx: -w / 2, ly: -h / 2 },
    n: { lx: 0, ly: -h / 2 },
    ne: { lx: w / 2, ly: -h / 2 },
    e: { lx: w / 2, ly: 0 },
    se: { lx: w / 2, ly: h / 2 },
    s: { lx: 0, ly: h / 2 },
    sw: { lx: -w / 2, ly: h / 2 },
    w: { lx: -w / 2, ly: 0 },
  };

  const result = {} as Record<ResizeHandle, { x: number; y: number }>;
  for (const [id, local] of Object.entries(localHandles) as [ResizeHandle, { lx: number; ly: number }][]) {
    const hx = cx + local.lx * cos - local.ly * sin - size / 2;
    const hy = cy + local.lx * sin + local.ly * cos - size / 2;
    result[id] = { x: hx, y: hy };
  }
  return result;
}

export function hitTestResizeHandle(
  px: number,
  py: number,
  bounds: ElementBounds,
  hitSize = RESIZE_HANDLE_HIT,
): ResizeHandle | null {
  const positions = getResizeHandlePositions(bounds, hitSize);
  const order: ResizeHandle[] = ["se", "sw", "ne", "nw", "e", "w", "n", "s"];
  for (const id of order) {
    const handle = positions[id];
    if (px >= handle.x && px <= handle.x + hitSize && py >= handle.y && py <= handle.y + hitSize) {
      return id;
    }
  }
  return null;
}

export function getRotationHandlePosition(bounds: ElementBounds): { x: number; y: number } {
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const rad = (bounds.rotation * Math.PI) / 180;
  const lx = 0;
  const ly = -bounds.h / 2 - ROTATION_HANDLE_OFFSET;
  const handleCx = cx + lx * Math.cos(rad) - ly * Math.sin(rad);
  const handleCy = cy + lx * Math.sin(rad) + ly * Math.cos(rad);
  return {
    x: handleCx - ROTATION_HANDLE_HIT / 2,
    y: handleCy - ROTATION_HANDLE_HIT / 2,
  };
}

function getElementTopCenter(bounds: ElementBounds): { x: number; y: number } {
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const rad = (bounds.rotation * Math.PI) / 180;
  const ly = -bounds.h / 2;
  return {
    x: cx - ly * Math.sin(rad),
    y: cy + ly * Math.cos(rad),
  };
}

export function hitTestRotationHandle(
  px: number,
  py: number,
  bounds: ElementBounds,
  hitSize = ROTATION_HANDLE_HIT,
): boolean {
  const pos = getRotationHandlePosition(bounds);
  return px >= pos.x && px <= pos.x + hitSize && py >= pos.y && py <= pos.y + hitSize;
}

const imageCache = new Map<string, HTMLImageElement>();
const imagePending = new Map<string, Promise<HTMLImageElement | null>>();

/** Synchronously get an already-decoded image (for jank-free redraws during drags). */
export function getCachedImage(url: string): HTMLImageElement | null {
  return imageCache.get(url) ?? null;
}

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  const cached = imageCache.get(url);
  if (cached) return cached;
  const inflight = imagePending.get(url);
  if (inflight) return inflight;

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  }).then((img) => {
    imagePending.delete(url);
    if (img) imageCache.set(url, img);
    return img;
  });

  imagePending.set(url, promise);
  return promise;
}

/** QR is expensive to generate — cache one high-res bitmap per (url, fg, bg) and scale on draw. */
const QR_CACHE_RESOLUTION = 1024;
const qrCanvasCache = new Map<string, HTMLCanvasElement>();
const qrPending = new Map<string, Promise<HTMLCanvasElement>>();

function qrCacheKey(url: string, fg: string, bg: string): string {
  return `${url}\u0000${normalizeHex(fg, "#0a0a0a")}\u0000${normalizeHex(bg, "#ffffff")}`;
}

export function getCachedQrCanvas(url: string, fg: string, bg: string): HTMLCanvasElement | null {
  return qrCanvasCache.get(qrCacheKey(url, fg, bg)) ?? null;
}

async function getQrCanvas(url: string, fg: string, bg: string): Promise<HTMLCanvasElement> {
  const key = qrCacheKey(url, fg, bg);
  const cached = qrCanvasCache.get(key);
  if (cached) return cached;
  const inflight = qrPending.get(key);
  if (inflight) return inflight;

  const promise = (async () => {
    const scratch = document.createElement("canvas");
    await QRCode.toCanvas(scratch, url, {
      width: QR_CACHE_RESOLUTION,
      margin: 1,
      color: { dark: normalizeHex(fg, "#0a0a0a"), light: normalizeHex(bg, "#ffffff") },
    });
    qrCanvasCache.set(key, scratch);
    qrPending.delete(key);
    return scratch;
  })();

  qrPending.set(key, promise);
  return promise;
}

async function drawQrModule(
  ctx: CanvasRenderingContext2D,
  url: string,
  x: number,
  y: number,
  size: number,
  fg: string,
  bg: string,
): Promise<void> {
  const qr = await getQrCanvas(url, fg, bg);
  ctx.drawImage(qr, x, y, size, size);
}

function drawRotatedImage(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  bounds: ElementBounds,
) {
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((bounds.rotation * Math.PI) / 180);
  ctx.drawImage(img, -bounds.w / 2, -bounds.h / 2, bounds.w, bounds.h);
  ctx.restore();
}

function drawRotatedTextBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  bounds: ElementBounds,
  fontSize: number,
  fontId: string,
  color: string,
  canvasWidth: number,
) {
  const font = getQRFont(fontId);
  const fontFamily = `"${font.googleFamily}", system-ui, sans-serif`;
  const block = measureTextBlock(ctx, text, fontSize, canvasWidth * 0.9, fontFamily, font.nameWeight);
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((bounds.rotation * Math.PI) / 180);
  ctx.fillStyle = normalizeHex(color, "#0a0a0a");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lineHeight = fontSize * 1.25;
  const startY = -block.height / 2 + lineHeight / 2;
  ctx.font = `${font.nameWeight} ${fontSize}px ${fontFamily}`;
  block.lines.forEach((line, i) => {
    ctx.fillText(line, 0, startY + i * lineHeight);
  });
  ctx.restore();
}

function drawBrutalBorder(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = "#0a0a0a";
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, width - 8, height - 8);
}

const GRID_SEGMENTS = 20;

function drawAlignmentGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  for (let i = 1; i < GRID_SEGMENTS; i++) {
    const fraction = i / GRID_SEGMENTS;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.04)";
    ctx.lineWidth = 1;
    const x = Math.round(fraction * width) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    const y = Math.round(fraction * height) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEditorGuides(
  ctx: CanvasRenderingContext2D,
  bounds: Record<string, ElementBounds>,
  selected: SelectedElement | null,
) {
  const selectedKey = selected ? elementKey(selected) : null;
  for (const [key, box] of Object.entries(bounds)) {
    const isSelected = key === selectedKey;
    ctx.save();
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate((box.rotation * Math.PI) / 180);
    ctx.strokeStyle = isSelected ? "rgba(139, 92, 246, 0.95)" : "rgba(0, 0, 0, 0.12)";
    ctx.lineWidth = isSelected ? 1.5 : 1;
    ctx.strokeRect(-box.w / 2 + 0.5, -box.h / 2 + 0.5, box.w, box.h);

    if (isSelected) {
      const handles = getResizeHandlePositions(box, RESIZE_HANDLE_SIZE);
      for (const pos of Object.values(handles)) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(pos.x, pos.y, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE);
        ctx.strokeStyle = "rgba(139, 92, 246, 0.95)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pos.x + 0.5, pos.y + 0.5, RESIZE_HANDLE_SIZE - 1, RESIZE_HANDLE_SIZE - 1);
      }
      const rot = getRotationHandlePosition(box);
      const rotCx = rot.x + ROTATION_HANDLE_HIT / 2;
      const rotCy = rot.y + ROTATION_HANDLE_HIT / 2;
      const top = getElementTopCenter(box);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(rotCx, rotCy);
      ctx.strokeStyle = "rgba(139, 92, 246, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath();
      ctx.arc(rotCx, rotCy, ROTATION_HANDLE_HIT / 2 - 1, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "rgba(139, 92, 246, 0.95)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.save();
      ctx.translate(rotCx, rotCy);
      ctx.strokeStyle = "rgba(139, 92, 246, 0.95)";
      ctx.lineWidth = 1.75;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, -Math.PI * 0.85, Math.PI * 0.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(5.8, 2.2);
      ctx.lineTo(8.2, 4.8);
      ctx.lineTo(5.4, 5.6);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
}

async function renderQrOnly(canvas: HTMLCanvasElement, url: string, qrFg: string, qrBg: string) {
  const { width, height } = CANVAS_SIZE.qr;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = normalizeHex(qrBg, "#ffffff");
  ctx.fillRect(0, 0, width, height);
  await drawQrModule(ctx, url, 0, 0, width, qrFg, qrBg);
}

async function renderLayoutDesign(
  canvas: HTMLCanvasElement,
  template: Exclude<QRDesignTemplate, "qr">,
  url: string,
  qrFg: string,
  qrBg: string,
  side: SideDesign,
  editor?: {
    selected: SelectedElement | null;
    showGuides: boolean;
    showGrid: boolean;
  },
) {
  const { width, height } = CANVAS_SIZE[template];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = normalizeHex(side.layoutBg, "#ffffff");
  ctx.fillRect(0, 0, width, height);

  if (editor?.showGrid) drawAlignmentGrid(ctx, width, height);

  const bounds = computeElementBounds(template, side, width, height);
  const imageById = new Map(side.images.map((img) => [img.id, img]));
  const textById = new Map(side.textBoxes.map((box) => [box.id, box]));

  for (const layer of getSideLayers(side)) {
    const box = bounds[elementKey(layer.ref)];
    if (!box) continue;

    if (layer.ref.kind === "image") {
      const img = imageById.get(layer.ref.id);
      if (!img) continue;
      const loaded = await loadImage(img.url);
      if (loaded) drawRotatedImage(ctx, loaded, box);
    } else if (layer.ref.kind === "qr") {
      const qrScratch = await getQrCanvas(url, qrFg, qrBg);
      drawRotatedImage(ctx, qrScratch, box);
    } else {
      const textBox = textById.get(layer.ref.id);
      if (!textBox) continue;
      await ensureQRFontsForRender(textBox.fontId, textBox.fontId);
      drawRotatedTextBlock(
        ctx,
        textBox.text,
        box,
        scaledSize(template, "text", textBox.placement.scale),
        textBox.fontId,
        textBox.color,
        width,
      );
    }
  }

  drawBrutalBorder(ctx, width, height);

  if (editor?.showGuides) {
    drawEditorGuides(ctx, bounds, editor.selected);
  }
}

export async function renderDesignToCanvas(
  canvas: HTMLCanvasElement,
  options: {
    template: QRDesignTemplate;
    url: string;
    qrFg: string;
    qrBg: string;
    design: QRDesignConfig;
    visitCardSide?: VisitCardSide;
    editor?: { selected: SelectedElement | null; showGuides: boolean; showGrid: boolean };
  },
): Promise<void> {
  const { template, url, qrFg, qrBg, design, visitCardSide = "front", editor } = options;
  if (template === "qr") {
    await renderQrOnly(canvas, url, qrFg, qrBg);
    return;
  }
  const side = getSideDesign(design, template, visitCardSide);
  const fontIds = side.textBoxes.map((b) => b.fontId);
  if (fontIds.length) {
    await ensureQRFontsForRender(fontIds[0], fontIds[0]);
    for (const id of fontIds.slice(1)) await ensureQRFontsForRender(id, id);
  }
  await renderLayoutDesign(canvas, template, url, qrFg, qrBg, side, editor);
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }, "image/png");
}

export function placementFromCanvasPoint(
  template: Exclude<QRDesignTemplate, "qr">,
  canvasX: number,
  canvasY: number,
): ElementPlacement {
  const { width, height } = CANVAS_SIZE[template];
  return clampPlacement({
    x: canvasX / width,
    y: canvasY / height,
    scale: 0.75,
    rotation: 0,
  });
}
