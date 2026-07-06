import QRCode from "qrcode";

export type QRDesignTemplate = "qr" | "table_sticker" | "visit_card";

export type QRDesignConfig = {
  template: QRDesignTemplate;
  layoutBg: string;
  accentColor: string;
  showName: boolean;
  tagline: string;
  logoUrl: string | null;
};

export const CANVAS_SIZE: Record<QRDesignTemplate, { width: number; height: number }> = {
  qr: { width: 512, height: 512 },
  table_sticker: { width: 720, height: 720 },
  visit_card: { width: 960, height: 540 },
};

export function normalizeHex(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed;
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed}`;
  return fallback;
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
  };
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

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  font: string,
  color = "#0a0a0a",
) {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(text, centerX, y);
}

async function renderQrOnly(
  canvas: HTMLCanvasElement,
  url: string,
  qrFg: string,
  qrBg: string,
) {
  const { width, height } = CANVAS_SIZE.qr;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = normalizeHex(qrBg, "#ffffff");
  ctx.fillRect(0, 0, width, height);
  await drawQrModule(ctx, url, 0, 0, width, qrFg, qrBg);
}

async function renderTableSticker(
  canvas: HTMLCanvasElement,
  url: string,
  businessName: string,
  qrFg: string,
  qrBg: string,
  design: QRDesignConfig,
) {
  const { width, height } = CANVAS_SIZE.table_sticker;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = normalizeHex(design.layoutBg, "#ffffff");
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = normalizeHex(design.accentColor, "#9b7fe8");
  ctx.fillRect(0, 0, width, 56);

  let cursorY = 72;
  const centerX = width / 2;

  if (design.logoUrl) {
    const logo = await loadImage(design.logoUrl);
    if (logo) {
      const logoSize = 88;
      ctx.drawImage(logo, centerX - logoSize / 2, cursorY, logoSize, logoSize);
      cursorY += logoSize + 16;
    }
  }

  if (design.showName && businessName) {
    drawCenteredText(ctx, businessName.toUpperCase(), centerX, cursorY, "800 28px system-ui, sans-serif");
    cursorY += 40;
  }

  const qrSize = 280;
  await drawQrModule(ctx, url, centerX - qrSize / 2, cursorY, qrSize, qrFg, qrBg);
  cursorY += qrSize + 20;

  drawCenteredText(ctx, design.tagline, centerX, cursorY, "700 22px system-ui, sans-serif");
  cursorY += 34;

  drawCenteredText(ctx, url.replace(/^https?:\/\//, ""), centerX, cursorY, "600 16px ui-monospace, monospace", "#52525b");

  drawBrutalBorder(ctx, width, height);
}

async function renderVisitCard(
  canvas: HTMLCanvasElement,
  url: string,
  businessName: string,
  qrFg: string,
  qrBg: string,
  design: QRDesignConfig,
) {
  const { width, height } = CANVAS_SIZE.visit_card;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const panelWidth = Math.round(width * 0.42);
  ctx.fillStyle = normalizeHex(design.accentColor, "#9b7fe8");
  ctx.fillRect(0, 0, panelWidth, height);

  let leftY = 48;
  if (design.logoUrl) {
    const logo = await loadImage(design.logoUrl);
    if (logo) {
      const logoSize = 96;
      ctx.drawImage(logo, 40, leftY, logoSize, logoSize);
      leftY += logoSize + 24;
    }
  }

  if (design.showName && businessName) {
    ctx.fillStyle = "#0a0a0a";
    ctx.font = "800 26px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const words = businessName.toUpperCase().split(" ");
    let line = "";
    const maxWidth = panelWidth - 80;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, 40, leftY);
        leftY += 32;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, 40, leftY);
  }

  ctx.fillStyle = normalizeHex(design.layoutBg, "#fafafa");
  ctx.fillRect(panelWidth, 0, width - panelWidth, height);

  const qrSize = 220;
  const qrX = panelWidth + (width - panelWidth - qrSize) / 2;
  const qrY = (height - qrSize) / 2 - 20;
  await drawQrModule(ctx, url, qrX, qrY, qrSize, qrFg, qrBg);

  drawCenteredText(
    ctx,
    design.tagline,
    panelWidth + (width - panelWidth) / 2,
    qrY + qrSize + 16,
    "700 18px system-ui, sans-serif",
  );

  drawBrutalBorder(ctx, width, height);
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
  },
): Promise<void> {
  const { template, url, businessName, qrFg, qrBg, design } = options;
  if (template === "qr") {
    await renderQrOnly(canvas, url, qrFg, qrBg);
    return;
  }
  if (template === "visit_card") {
    await renderVisitCard(canvas, url, businessName, qrFg, qrBg, design);
    return;
  }
  await renderTableSticker(canvas, url, businessName, qrFg, qrBg, design);
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
