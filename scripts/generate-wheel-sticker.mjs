/**
 * Generate a 10×10 cm prize-wheel sticker template (300 DPI PNG + SVG).
 * Usage: node scripts/generate-wheel-sticker.mjs [output-dir]
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const ICON_DIR = path.join(ROOT, "public", "prize-icons");

/** 10 cm @ 300 DPI — print-ready */
const CM = 10;
const DPI = 300;
const SIZE = Math.round((CM / 2.54) * DPI);
const STROKE = "#0a0a0a";
const STROKE_W = Math.max(3, SIZE * 0.0045);
const SLICE_STROKE = Math.max(2, SIZE * 0.0028);

const PALETTE = ["#f5e08e", "#d8ccf5", "#f48fb1", "#a8e6cf", "#b8cfe8", "#f4a89a", "#c8e6f5", "#ffd4a8"];

/** Eight varied food icons from the site pack */
const SLICES = [
  { icon: "coffee_cup", plate: "#ffe8dc" },
  { icon: "cupcake", plate: "#ffe4f0" },
  { icon: "pizza_slice", plate: "#ffe9d4" },
  { icon: "burger_cute", plate: "#e8fce8" },
  { icon: "ice_cream_cone", plate: "#fff0e8" },
  { icon: "donut_pink", plate: "#ffe4f1" },
  { icon: "fries", plate: "#fff3c4" },
  { icon: "soda", plate: "#dff3ff" },
];

/** Layout: max wheel size that fits pointer on top + full disc inside canvas */
function layout() {
  const edge = Math.max(12, SIZE * 0.014);
  const pointerW = SIZE * 0.17;
  const pointerH = SIZE * 0.13;
  const pointerTop = edge;
  const pointerOverlap = pointerH * 0.28;

  // Vertical band available for the wheel disc (below pointer, above bottom edge)
  const bandTop = pointerTop + pointerH - pointerOverlap;
  const bandBottom = SIZE - edge - STROKE_W;
  const bandHeight = bandBottom - bandTop;

  const R = Math.min(bandHeight / 2, SIZE / 2 - edge - STROKE_W);
  const CX = SIZE / 2;
  const CY = (bandTop + bandBottom) / 2;

  const HUB_R = SIZE * 0.138;
  const pointerX = CX - pointerW / 2;
  const pointerY = pointerTop;
  const iconRadius = HUB_R + (R - HUB_R) * 0.58;
  const iconPlate = Math.round(SIZE * 0.145);
  const iconGlyph = Math.round(iconPlate * 0.8);

  return { CX, CY, R, HUB_R, pointerW, pointerH, pointerX, pointerY, iconRadius, iconPlate, iconGlyph };
}

function polar(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeSlice(cx, cy, r, startAngle, endAngle) {
  const start = polar(cx, cy, r, endAngle);
  const end = polar(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function wheelSvg(L) {
  const sliceCount = SLICES.length;
  const sliceAngle = 360 / sliceCount;
  const paths = [];

  for (let i = 0; i < sliceCount; i++) {
    const start = i * sliceAngle;
    const end = (i + 1) * sliceAngle;
    paths.push(
      `<path d="${describeSlice(L.CX, L.CY, L.R, start, end)}" fill="${PALETTE[i % PALETTE.length]}" stroke="${STROKE}" stroke-width="${SLICE_STROKE}" stroke-linejoin="round"/>`,
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <circle cx="${L.CX}" cy="${L.CY}" r="${L.R + STROKE_W}" fill="#ffffff" stroke="${STROKE}" stroke-width="${STROKE_W}"/>
  ${paths.join("\n  ")}
  <circle cx="${L.CX}" cy="${L.CY}" r="${L.HUB_R + STROKE_W}" fill="#ffffff" stroke="${STROKE}" stroke-width="${STROKE_W}"/>
  <circle cx="${L.CX}" cy="${L.CY}" r="${L.HUB_R - STROKE_W * 0.5}" fill="#ffffff" stroke="none"/>
  <g transform="translate(${L.pointerX} ${L.pointerY}) scale(${L.pointerW / 36})">
    <path d="M18 30.5 C18 30.5 3.5 14.5 3.5 10 C3.5 5.2 9.8 1.5 18 1.5 C26.2 1.5 32.5 5.2 32.5 10 C32.5 14.5 18 30.5 18 30.5 Z" fill="${STROKE}"/>
    <path d="M18 26.5 C18 26.5 8 13.8 8 10.2 C8 7.2 12.2 4.8 18 4.8 C23.8 4.8 28 7.2 28 10.2 C28 13.8 18 26.5 18 26.5 Z" fill="#f5e08e"/>
  </g>
</svg>`;
}

async function plateCircle(diameter, color) {
  const r = Math.round(diameter / 2);
  return sharp({
    create: {
      width: diameter,
      height: diameter,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${diameter}" height="${diameter}" xmlns="http://www.w3.org/2000/svg"><circle cx="${r}" cy="${r}" r="${r - 1}" fill="${color}"/></svg>`,
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();
}

async function main() {
  const outDir = process.argv[2] || path.join(process.env.USERPROFILE || "", "Desktop");
  fs.mkdirSync(outDir, { recursive: true });

  const L = layout();
  const baseName = "starspin-wheel-sticker-10cm";
  const pngPath = path.join(outDir, `${baseName}.png`);
  const svgPath = path.join(outDir, `${baseName}.svg`);

  const svg = wheelSvg(L);
  fs.writeFileSync(svgPath, svg);

  const sliceCount = SLICES.length;
  const sliceAngle = 360 / sliceCount;
  const composites = [];

  for (let i = 0; i < sliceCount; i++) {
    const mid = i * sliceAngle + sliceAngle / 2;
    const pos = polar(L.CX, L.CY, L.iconRadius, mid);
    const slice = SLICES[i];
    const iconPath = path.join(ICON_DIR, `${slice.icon}.webp`);
    if (!fs.existsSync(iconPath)) {
      throw new Error(`Missing icon: ${iconPath}`);
    }

    const plate = await plateCircle(L.iconPlate, slice.plate);
    const glyph = await sharp(iconPath)
      .resize(L.iconGlyph, L.iconGlyph, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const left = Math.round(pos.x - L.iconPlate / 2);
    const top = Math.round(pos.y - L.iconPlate / 2);
    const glyphPad = Math.round((L.iconPlate - L.iconGlyph) / 2);

    composites.push({ input: plate, left, top });
    composites.push({ input: glyph, left: left + glyphPad, top: top + glyphPad });
  }

  await sharp(Buffer.from(svg))
    .composite(composites)
    .png({ compressionLevel: 6 })
    .withMetadata({ density: DPI })
    .toFile(pngPath);

  const wheelCm = ((L.R * 2) / SIZE) * CM;
  const top = L.CY - L.R - STROKE_W;
  const bottom = L.CY + L.R + STROKE_W;
  console.log(`Wrote ${pngPath}`);
  console.log(`Wrote ${svgPath}`);
  console.log(`Canvas: ${CM}×${CM} cm @ ${DPI} DPI — wheel Ø ${wheelCm.toFixed(1)} cm`);
  console.log(`Bounds: top ${top.toFixed(0)}px bottom ${bottom.toFixed(0)}px (canvas ${SIZE}px)`);
  if (top < 0 || bottom > SIZE) {
    throw new Error("Wheel clipped — layout bug");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
