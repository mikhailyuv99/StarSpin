import QRCode from "qrcode";

export type QRDesignTemplate = "qr" | "table_sticker" | "visit_card";
export type VisitCardSide = "front" | "back";
export type DesignElementKey = "logo" | "name" | "qr" | "tagline";

export type ElementPlacement = {
  x: number;
  y: number;
  scale: number;
};

export type TemplateLayout = Record<DesignElementKey, ElementPlacement>;

export type CardSideSettings = {
  layoutBg: string;
  accentColor: string;
  tagline: string;
  showName: boolean;
  showQr: boolean;
  splitPanel: boolean;
  layout: TemplateLayout;
};

export type QRDesignConfig = {
  template: QRDesignTemplate;
  layoutBg: string;
  accentColor: string;
  showName: boolean;
  tagline: string;
  logoUrl: string | null;
  layouts: { table_sticker: TemplateLayout };
  visitCard: { front: CardSideSettings; back: CardSideSettings };
};

export type ElementBounds = { x: number; y: number; w: number; h: number };

export type RenderSideContext = {
  layoutBg: string;
  accentColor: string;
  tagline: string;
  showName: boolean;
  showQr: boolean;
  splitPanel: boolean;
  layout: TemplateLayout;
};

export const CANVAS_SIZE: Record<QRDesignTemplate, { width: number; height: number }> = {
  qr: { width: 512, height: 512 },
  table_sticker: { width: 720, height: 720 },
  visit_card: { width: 960, height: 540 },
};

export const PREVIEW_MAX_WIDTH: Record<QRDesignTemplate, number> = {
  qr: 220,
  table_sticker: 260,
  visit_card: 320,
};

const BASE: Record<Exclude<QRDesignTemplate, "qr">, Record<DesignElementKey, number>> = {
  table_sticker: { logo: 88, name: 28, qr: 280, tagline: 22 },
  visit_card: { logo: 96, name: 26, qr: 220, tagline: 18 },
};

const DEFAULT_VISIT_CARD_LAYOUT: TemplateLayout = {
  logo: { x: 0.17, y: 0.22, scale: 1 },
  name: { x: 0.17, y: 0.48, scale: 1 },
  qr: { x: 0.71, y: 0.44, scale: 1 },
  tagline: { x: 0.71, y: 0.72, scale: 1 },
};

const DEFAULT_VISIT_CARD_BACK_LAYOUT: TemplateLayout = {
  logo: { x: 0.5, y: 0.32, scale: 1.1 },
  name: { x: 0.5, y: 0.5, scale: 1 },
  tagline: { x: 0.5, y: 0.68, scale: 1 },
  qr: { x: 0.5, y: 0.84, scale: 0.5 },
};

export const DEFAULT_LAYOUTS = {
  table_sticker: {
    logo: { x: 0.5, y: 0.11, scale: 1 },
    name: { x: 0.5, y: 0.28, scale: 1 },
    qr: { x: 0.5, y: 0.52, scale: 1 },
    tagline: { x: 0.5, y: 0.78, scale: 1 },
  } satisfies TemplateLayout,
};

const MIN_SCALE = 0.35;
const MAX_SCALE = 2.5;

export function clampPlacement(placement: ElementPlacement): ElementPlacement {
  return {
    x: Math.min(0.98, Math.max(0.02, placement.x)),
    y: Math.min(0.98, Math.max(0.02, placement.y)),
    scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, placement.scale)),
  };
}

export function normalizeHex(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed;
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed}`;
  return fallback;
}

function parsePlacement(raw: unknown, fallback: ElementPlacement): ElementPlacement {
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;
  return clampPlacement({
    x: typeof data.x === "number" ? data.x : fallback.x,
    y: typeof data.y === "number" ? data.y : fallback.y,
    scale: typeof data.scale === "number" ? data.scale : fallback.scale,
  });
}

function parseTemplateLayout(raw: unknown, fallback: TemplateLayout): TemplateLayout {
  if (!raw || typeof raw !== "object") return { ...fallback };
  const data = raw as Record<string, unknown>;
  return {
    logo: parsePlacement(data.logo, fallback.logo),
    name: parsePlacement(data.name, fallback.name),
    qr: parsePlacement(data.qr, fallback.qr),
    tagline: parsePlacement(data.tagline, fallback.tagline),
  };
}

function defaultVisitCardSide(
  merchant: { primary_color: string },
  side: VisitCardSide,
): CardSideSettings {
  const accent = merchant.primary_color || "#9b7fe8";
  if (side === "front") {
    return {
      layoutBg: "#fafafa",
      accentColor: accent,
      tagline: "Scan · Review · Spin",
      showName: true,
      showQr: true,
      splitPanel: true,
      layout: { ...DEFAULT_VISIT_CARD_LAYOUT },
    };
  }
  return {
    layoutBg: "#ffffff",
    accentColor: accent,
    tagline: "Thank you for visiting!",
    showName: true,
    showQr: false,
    splitPanel: false,
    layout: { ...DEFAULT_VISIT_CARD_BACK_LAYOUT },
  };
}

export function defaultQRDesign(merchant: {
  primary_color: string;
  logo_url?: string | null;
}): QRDesignConfig {
  return {
    template: "table_sticker",
    layoutBg: "#ffffff",
    accentColor: merchant.primary_color || "#9b7fe8",
    showName: true,
    tagline: "Scan · Review · Spin",
    logoUrl: merchant.logo_url ?? null,
    layouts: {
      table_sticker: { ...DEFAULT_LAYOUTS.table_sticker },
    },
    visitCard: {
      front: defaultVisitCardSide(merchant, "front"),
      back: defaultVisitCardSide(merchant, "back"),
    },
  };
}

function parseCardSide(raw: unknown, fallback: CardSideSettings): CardSideSettings {
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Record<string, unknown>;
  return {
    layoutBg:
      typeof data.layoutBg === "string" ? normalizeHex(data.layoutBg, fallback.layoutBg) : fallback.layoutBg,
    accentColor:
      typeof data.accentColor === "string"
        ? normalizeHex(data.accentColor, fallback.accentColor)
        : fallback.accentColor,
    tagline:
      typeof data.tagline === "string" && data.tagline.trim() ? data.tagline : fallback.tagline,
    showName: typeof data.showName === "boolean" ? data.showName : fallback.showName,
    showQr: typeof data.showQr === "boolean" ? data.showQr : fallback.showQr,
    splitPanel: typeof data.splitPanel === "boolean" ? data.splitPanel : fallback.splitPanel,
    layout: parseTemplateLayout(data.layout, fallback.layout),
  };
}

export function parseQRDesign(
  raw: unknown,
  merchant: { primary_color: string; logo_url?: string | null },
): QRDesignConfig {
  const base = defaultQRDesign(merchant);
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Record<string, unknown>;
  const template = data.template;
  const layoutsRaw = data.layouts;
  const layoutsObj =
    layoutsRaw && typeof layoutsRaw === "object" ? (layoutsRaw as Record<string, unknown>) : {};

  const visitCardRaw = data.visitCard;
  let visitCard = base.visitCard;

  if (visitCardRaw && typeof visitCardRaw === "object") {
    const vc = visitCardRaw as Record<string, unknown>;
    visitCard = {
      front: parseCardSide(vc.front, base.visitCard.front),
      back: parseCardSide(vc.back, base.visitCard.back),
    };
  } else if (layoutsObj.visit_card) {
    visitCard = {
      front: {
        ...base.visitCard.front,
        layoutBg:
          typeof data.layoutBg === "string"
            ? normalizeHex(data.layoutBg, base.visitCard.front.layoutBg)
            : base.visitCard.front.layoutBg,
        accentColor:
          typeof data.accentColor === "string"
            ? normalizeHex(data.accentColor, base.visitCard.front.accentColor)
            : base.visitCard.front.accentColor,
        tagline:
          typeof data.tagline === "string" && data.tagline.trim()
            ? data.tagline
            : base.visitCard.front.tagline,
        showName: typeof data.showName === "boolean" ? data.showName : base.visitCard.front.showName,
        layout: parseTemplateLayout(layoutsObj.visit_card, DEFAULT_VISIT_CARD_LAYOUT),
      },
      back: base.visitCard.back,
    };
  }

  return {
    template:
      template === "qr" || template === "table_sticker" || template === "visit_card"
        ? template
        : base.template,
    layoutBg: typeof data.layoutBg === "string" ? normalizeHex(data.layoutBg, base.layoutBg) : base.layoutBg,
    accentColor:
      typeof data.accentColor === "string"
        ? normalizeHex(data.accentColor, base.accentColor)
        : base.accentColor,
    showName: typeof data.showName === "boolean" ? data.showName : base.showName,
    tagline: typeof data.tagline === "string" && data.tagline.trim() ? data.tagline : base.tagline,
    logoUrl:
      typeof data.logoUrl === "string" && data.logoUrl.trim()
        ? data.logoUrl
        : merchant.logo_url ?? null,
    layouts: {
      table_sticker: parseTemplateLayout(layoutsObj.table_sticker, DEFAULT_LAYOUTS.table_sticker),
    },
    visitCard,
  };
}

export function getRenderContext(
  design: QRDesignConfig,
  template: Exclude<QRDesignTemplate, "qr">,
  visitCardSide: VisitCardSide,
): RenderSideContext {
  if (template === "table_sticker") {
    return {
      layoutBg: design.layoutBg,
      accentColor: design.accentColor,
      tagline: design.tagline,
      showName: design.showName,
      showQr: true,
      splitPanel: false,
      layout: design.layouts.table_sticker,
    };
  }
  const side = design.visitCard[visitCardSide];
  return {
    layoutBg: side.layoutBg,
    accentColor: side.accentColor,
    tagline: side.tagline,
    showName: side.showName,
    showQr: side.showQr,
    splitPanel: side.splitPanel,
    layout: side.layout,
  };
}

function scaledSize(template: Exclude<QRDesignTemplate, "qr">, key: DesignElementKey, scale: number): number {
  return BASE[template][key] * scale;
}

function measureTextBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  maxWidth: number,
): { width: number; height: number; lines: string[] } {
  ctx.font = `800 ${fontSize}px system-ui, sans-serif`;
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

export function computeElementBounds(
  template: Exclude<QRDesignTemplate, "qr">,
  ctx: RenderSideContext,
  canvasWidth: number,
  canvasHeight: number,
  businessName: string,
  options: { hasLogo: boolean },
): Partial<Record<DesignElementKey, ElementBounds>> {
  const bounds: Partial<Record<DesignElementKey, ElementBounds>> = {};
  const scratch = document.createElement("canvas");
  const c = scratch.getContext("2d");
  if (!c) return bounds;

  const layout = ctx.layout;
  const toRect = (key: DesignElementKey, w: number, h: number): ElementBounds => {
    const p = layout[key];
    return {
      x: p.x * canvasWidth - w / 2,
      y: p.y * canvasHeight - h / 2,
      w,
      h,
    };
  };

  if (options.hasLogo) {
    const size = scaledSize(template, "logo", layout.logo.scale);
    bounds.logo = toRect("logo", size, size);
  }

  if (ctx.showName && businessName) {
    const fontSize = scaledSize(template, "name", layout.name.scale);
    const maxWidth = canvasWidth * (template === "visit_card" && ctx.splitPanel ? 0.32 : 0.85);
    const block = measureTextBlock(c, businessName.toUpperCase(), fontSize, maxWidth);
    bounds.name = toRect("name", Math.max(block.width, 40), Math.max(block.height, fontSize));
  }

  if (ctx.showQr) {
    const qrSize = scaledSize(template, "qr", layout.qr.scale);
    bounds.qr = toRect("qr", qrSize, qrSize);
  }

  if (ctx.tagline) {
    const fontSize = scaledSize(template, "tagline", layout.tagline.scale);
    c.font = `700 ${fontSize}px system-ui, sans-serif`;
    const w = c.measureText(ctx.tagline).width;
    bounds.tagline = toRect("tagline", Math.max(w, 40), fontSize * 1.2);
  }

  return bounds;
}

export function hitTestElement(
  px: number,
  py: number,
  bounds: Partial<Record<DesignElementKey, ElementBounds>>,
): DesignElementKey | null {
  const order: DesignElementKey[] = ["tagline", "name", "logo", "qr"];
  for (const key of order) {
    const box = bounds[key];
    if (!box) continue;
    if (px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h) return key;
  }
  return null;
}

export function hitTestResizeHandle(
  px: number,
  py: number,
  bounds: ElementBounds,
  handleSize = 14,
): boolean {
  const hx = bounds.x + bounds.w - handleSize / 2;
  const hy = bounds.y + bounds.h - handleSize / 2;
  return px >= hx && px <= hx + handleSize && py >= hy && py <= hy + handleSize;
}

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image load failed"));
      img.src = url;
    });
  } catch {
    return null;
  }
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
  const scratch = document.createElement("canvas");
  await QRCode.toCanvas(scratch, url, {
    width: size,
    margin: 1,
    color: { dark: normalizeHex(fg, "#0a0a0a"), light: normalizeHex(bg, "#ffffff") },
  });
  ctx.drawImage(scratch, x, y, size, size);
}

function drawBrutalBorder(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = "#0a0a0a";
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, width - 8, height - 8);
}

function drawCenteredTextBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  fontSize: number,
  maxWidth: number,
  color = "#0a0a0a",
  weight = "800",
) {
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const block = measureTextBlock(ctx, text, fontSize, maxWidth);
  const lineHeight = fontSize * 1.25;
  const startY = centerY - block.height / 2 + lineHeight / 2;
  ctx.font = `${weight} ${fontSize}px system-ui, sans-serif`;
  block.lines.forEach((line, i) => {
    ctx.fillText(line, centerX, startY + i * lineHeight);
  });
}

function drawEditorGuides(
  ctx: CanvasRenderingContext2D,
  bounds: Partial<Record<DesignElementKey, ElementBounds>>,
  selected: DesignElementKey | null,
) {
  for (const [key, box] of Object.entries(bounds) as [DesignElementKey, ElementBounds][]) {
    const isSelected = key === selected;
    ctx.save();
    ctx.strokeStyle = isSelected ? "#9b7fe8" : "rgba(10,10,10,0.25)";
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.setLineDash(isSelected ? [] : [6, 4]);
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    if (isSelected) {
      ctx.fillStyle = "#9b7fe8";
      ctx.fillRect(box.x + box.w - 8, box.y + box.h - 8, 16, 16);
      ctx.strokeStyle = "#0a0a0a";
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x + box.w - 8, box.y + box.h - 8, 16, 16);
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
  businessName: string,
  qrFg: string,
  qrBg: string,
  sideCtx: RenderSideContext,
  logoUrl: string | null,
  editor?: { selected: DesignElementKey | null; showGuides: boolean },
) {
  const { width, height } = CANVAS_SIZE[template];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const layout = sideCtx.layout;

  ctx.fillStyle = normalizeHex(sideCtx.layoutBg, "#ffffff");
  ctx.fillRect(0, 0, width, height);

  if (template === "table_sticker") {
    ctx.fillStyle = normalizeHex(sideCtx.accentColor, "#9b7fe8");
    ctx.fillRect(0, 0, width, 56);
  } else if (sideCtx.splitPanel) {
    const panelWidth = Math.round(width * 0.42);
    ctx.fillStyle = normalizeHex(sideCtx.accentColor, "#9b7fe8");
    ctx.fillRect(0, 0, panelWidth, height);
    ctx.fillStyle = normalizeHex(sideCtx.layoutBg, "#fafafa");
    ctx.fillRect(panelWidth, 0, width - panelWidth, height);
  } else {
    ctx.fillStyle = normalizeHex(sideCtx.accentColor, "#9b7fe8");
    ctx.fillRect(0, height - 12, width, 12);
  }

  if (logoUrl) {
    const logo = await loadImage(logoUrl);
    if (logo) {
      const size = scaledSize(template, "logo", layout.logo.scale);
      ctx.drawImage(logo, layout.logo.x * width - size / 2, layout.logo.y * height - size / 2, size, size);
    }
  }

  if (sideCtx.showName && businessName) {
    const fontSize = scaledSize(template, "name", layout.name.scale);
    const maxWidth = width * (template === "visit_card" && sideCtx.splitPanel ? 0.32 : 0.85);
    drawCenteredTextBlock(
      ctx,
      businessName,
      layout.name.x * width,
      layout.name.y * height,
      fontSize,
      maxWidth,
    );
  }

  if (sideCtx.showQr) {
    const qrSize = scaledSize(template, "qr", layout.qr.scale);
    await drawQrModule(
      ctx,
      url,
      layout.qr.x * width - qrSize / 2,
      layout.qr.y * height - qrSize / 2,
      qrSize,
      qrFg,
      qrBg,
    );
  }

  if (sideCtx.tagline) {
    const fontSize = scaledSize(template, "tagline", layout.tagline.scale);
    ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
    ctx.fillStyle = "#0a0a0a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sideCtx.tagline, layout.tagline.x * width, layout.tagline.y * height);
  }

  drawBrutalBorder(ctx, width, height);

  if (editor?.showGuides) {
    const bounds = computeElementBounds(template, sideCtx, width, height, businessName, {
      hasLogo: Boolean(logoUrl),
    });
    drawEditorGuides(ctx, bounds, editor.selected);
  }
}

export async function renderDesignToCanvas(
  canvas: HTMLCanvasElement,
  options: {
    template: QRDesignTemplate;
    url: string;
    businessName: string;
    qrFg: string;
    qrBg: string;
    design: QRDesignConfig;
    visitCardSide?: VisitCardSide;
    editor?: { selected: DesignElementKey | null; showGuides: boolean };
  },
): Promise<void> {
  const { template, url, businessName, qrFg, qrBg, design, visitCardSide = "front", editor } = options;
  if (template === "qr") {
    await renderQrOnly(canvas, url, qrFg, qrBg);
    return;
  }
  const sideCtx = getRenderContext(design, template, visitCardSide);
  await renderLayoutDesign(
    canvas,
    template,
    url,
    businessName,
    qrFg,
    qrBg,
    sideCtx,
    design.logoUrl,
    editor,
  );
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

export function resetTemplateLayout(
  design: QRDesignConfig,
  template: Exclude<QRDesignTemplate, "qr">,
  visitCardSide?: VisitCardSide,
): QRDesignConfig {
  if (template === "table_sticker") {
    return {
      ...design,
      layouts: {
        ...design.layouts,
        table_sticker: { ...DEFAULT_LAYOUTS.table_sticker },
      },
    };
  }
  const side = visitCardSide ?? "front";
  const defaults = defaultVisitCardSide({ primary_color: design.accentColor }, side);
  return {
    ...design,
    visitCard: {
      ...design.visitCard,
      [side]: { ...defaults, accentColor: design.visitCard[side].accentColor },
    },
  };
}

export function patchVisitCardSide(
  design: QRDesignConfig,
  side: VisitCardSide,
  patch: Partial<CardSideSettings>,
): QRDesignConfig {
  return {
    ...design,
    visitCard: {
      ...design.visitCard,
      [side]: { ...design.visitCard[side], ...patch },
    },
  };
}

export function patchLayoutElement(
  design: QRDesignConfig,
  template: Exclude<QRDesignTemplate, "qr">,
  key: DesignElementKey,
  patch: Partial<ElementPlacement>,
  visitCardSide: VisitCardSide = "front",
): QRDesignConfig {
  if (template === "table_sticker") {
    return {
      ...design,
      layouts: {
        ...design.layouts,
        table_sticker: {
          ...design.layouts.table_sticker,
          [key]: clampPlacement({ ...design.layouts.table_sticker[key], ...patch }),
        },
      },
    };
  }
  const sideConfig = design.visitCard[visitCardSide];
  return {
    ...design,
    visitCard: {
      ...design.visitCard,
      [visitCardSide]: {
        ...sideConfig,
        layout: {
          ...sideConfig.layout,
          [key]: clampPlacement({ ...sideConfig.layout[key], ...patch }),
        },
      },
    },
  };
}
