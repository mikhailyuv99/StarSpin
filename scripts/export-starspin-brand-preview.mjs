/**
 * STARSPIN brand preview — black mark on #ff9dc4.
 * Does NOT sync into the live app until approved.
 */
import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import toIco from "to-ico";
import opentype from "opentype.js";

const BRAND = {
  pink: "#ff9dc4",
  mark: "#0a0a0a",
};

const REPO = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(REPO, "scripts", "brand-preview", "logo-source.svg");
const FONT_CACHE = path.join(REPO, "scripts", "brand-preview", "bruno-ace.ttf");
const OUT = path.join(process.env.USERPROFILE ?? "", "Desktop", "STARSPIN Brand Preview");

const APP_ICON_PATHS = [
  ["favicon/favicon.ico", "src/app/favicon.ico"],
  ["favicon/apple-touch-icon-180.png", "src/app/apple-icon.png"],
  ["favicon/icon-512.png", "src/app/icon.png"],
  ["favicon/icon-192.png", "public/icon-192.png"],
  ["favicon/icon-512.png", "public/icon-512.png"],
  ["social/og-image-1200x630.png", "src/app/opengraph-image.png"],
  ["social/twitter-banner-1500x500.png", "src/app/twitter-image.png"],
];

let markPathsCache = null;
let markBoxCache = null;
let wordmarkFontCache = null;

async function loadMarkPaths() {
  if (markPathsCache) return markPathsCache;
  const raw = await fs.readFile(SOURCE, "utf8");
  const orangeBlock = raw.match(/<g fill="#f18b23">([\s\S]*?)<\/g>/);
  if (!orangeBlock) throw new Error("Could not find mark paths in logo-source.svg");
  markPathsCache = [...orangeBlock[1].matchAll(/<path d="([^"]+)"\s*\/>/g)].map((m) => m[1]);
  if (markPathsCache.length === 0) throw new Error("No paths found in mark group");
  return markPathsCache;
}

function pathsMarkup(paths) {
  return paths.map((d) => `<path d="${d}" fill="${BRAND.mark}"/>`).join("\n    ");
}

async function computeMarkBox() {
  if (markBoxCache) return markBoxCache;
  const paths = await loadMarkPaths();
  const probe = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="4096" viewBox="0 0 4096 4096">
  ${pathsMarkup(paths)}
</svg>`;

  const png = await sharp(Buffer.from(probe)).png().toBuffer();
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      if (data[i + 3] > 20) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  markBoxCache = {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
  return markBoxCache;
}

/** Square frame in source coordinates, normalized to a 0,0 viewBox via translate. */
async function squareMarkFrame(padRatio = 0.14) {
  const box = await computeMarkBox();
  const pad = Math.max(box.width, box.height) * padRatio;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const side = Math.max(box.width, box.height) + pad * 2;
  return {
    side,
    tx: cx - side / 2,
    ty: cy - side / 2,
    box,
  };
}

function markGroup(frame, paths) {
  return `<g transform="translate(${-frame.tx}, ${-frame.ty})">\n    ${pathsMarkup(paths)}\n  </g>`;
}

async function loadWordmarkFont() {
  if (wordmarkFontCache) return wordmarkFontCache;
  await ensureWordmarkFontFile();
  wordmarkFontCache = opentype.parse(readFileSync(FONT_CACHE));
  return wordmarkFontCache;
}

async function ensureWordmarkFontFile() {
  try {
    await fs.access(FONT_CACHE);
  } catch {
    const cssRes = await fetch(
      "https://fonts.googleapis.com/css2?family=Bruno+Ace&display=swap",
      { headers: { "User-Agent": "Mozilla/5.0" } },
    );
    const css = await cssRes.text();
    const match = css.match(/url\((https:\/\/[^)]+\.(?:woff2|ttf))\)/);
    if (!match) throw new Error("Could not resolve Bruno Ace font URL");
    const fontRes = await fetch(match[1]);
    await fs.writeFile(FONT_CACHE, Buffer.from(await fontRes.arrayBuffer()));
  }
}

async function layoutWordmark(text, fontSize, trackingRatio = -0.015) {
  const font = await loadWordmarkFont();
  const glyphs = font.stringToGlyphs(text);
  const scale = fontSize / font.unitsPerEm;
  const tracking = fontSize * trackingRatio;
  let x = 0;
  const parts = [];
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;

  for (let i = 0; i < glyphs.length; i++) {
    const glyph = glyphs[i];
    const glyphPath = glyph.getPath(x, 0, fontSize);
    parts.push(glyphPath.toPathData());
    const bbox = glyphPath.getBoundingBox();
    x1 = Math.min(x1, bbox.x1);
    y1 = Math.min(y1, bbox.y1);
    x2 = Math.max(x2, bbox.x2);
    y2 = Math.max(y2, bbox.y2);
    x += glyph.advanceWidth * scale + (i < glyphs.length - 1 ? tracking : 0);
  }

  return {
    d: parts.join(" "),
    bbox: { x1, y1, x2, y2 },
    width: x2 - x1,
    height: y2 - y1,
  };
}

/** Opentype paths are y-up; flip for SVG and center on (cx, cy). */
function centeredWordmarkMarkup(cx, cy, layout) {
  const bx = (layout.bbox.x1 + layout.bbox.x2) / 2;
  const by = (layout.bbox.y1 + layout.bbox.y2) / 2;
  return `<g transform="translate(${cx} ${cy}) scale(1 -1) translate(${-bx} ${-by})">
    <path d="${layout.d}" fill="${BRAND.mark}"/>
  </g>`;
}

/** Left-aligned wordmark with vertical center at cy. */
function leftWordmarkMarkup(x, cy, layout) {
  const by = (layout.bbox.y1 + layout.bbox.y2) / 2;
  return `<g transform="translate(${x} ${cy}) scale(1 -1) translate(0 ${-by})">
    <path d="${layout.d}" fill="${BRAND.mark}"/>
  </g>`;
}

async function iconSvg({ withBackground = true, padRatio = 0.14 } = {}) {
  const paths = await loadMarkPaths();
  const frame = await squareMarkFrame(padRatio);
  const bg = withBackground
    ? `<rect width="${frame.side}" height="${frame.side}" fill="${BRAND.pink}"/>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 ${frame.side} ${frame.side}">
  ${bg}
  ${markGroup(frame, paths)}
</svg>`;
}

async function wordmarkOnlySvg(width, height, fontSize) {
  const layout = await layoutWordmark("STARSPIN", fontSize);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${BRAND.pink}"/>
  ${centeredWordmarkMarkup(width / 2, height / 2, layout)}
</svg>`;
}

async function stackedLogoSvg(width, height) {
  const paths = await loadMarkPaths();
  const frame = await squareMarkFrame(0.12);
  const markSize = Math.min(width * 0.42, height * 0.48);
  const fontSize = Math.round(Math.min(width * 0.1, height * 0.12));
  const layout = await layoutWordmark("STARSPIN", fontSize);
  const gap = fontSize * 0.55;
  const blockH = markSize + gap + layout.height;
  const markY = (height - blockH) / 2;
  const markX = (width - markSize) / 2;
  const textY = markY + markSize + gap + layout.height / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${BRAND.pink}"/>
  <svg x="${markX}" y="${markY}" width="${markSize}" height="${markSize}" viewBox="0 0 ${frame.side} ${frame.side}" preserveAspectRatio="xMidYMid meet">
    ${markGroup(frame, paths)}
  </svg>
  ${centeredWordmarkMarkup(width / 2, textY, layout)}
</svg>`;
}

async function horizontalBannerSvg(width, height) {
  const paths = await loadMarkPaths();
  const frame = await squareMarkFrame(0.12);

  const maxBlockW = width * 0.86;
  let markSize = height * 0.62;
  let fontSize = Math.round(height * 0.24);
  let layout = await layoutWordmark("STARSPIN", fontSize);
  let gap = fontSize * 0.35;
  let blockW = markSize + gap + layout.width;

  if (blockW > maxBlockW) {
    const scale = maxBlockW / blockW;
    markSize *= scale;
    fontSize = Math.round(fontSize * scale);
    gap *= scale;
    layout = await layoutWordmark("STARSPIN", fontSize);
    blockW = markSize + gap + layout.width;
  }

  const blockX = (width - blockW) / 2;
  const markY = (height - markSize) / 2;
  const textX = blockX + markSize + gap;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${BRAND.pink}"/>
  <svg x="${blockX}" y="${markY}" width="${markSize}" height="${markSize}" viewBox="0 0 ${frame.side} ${frame.side}" preserveAspectRatio="xMidYMid meet">
    ${markGroup(frame, paths)}
  </svg>
  ${leftWordmarkMarkup(textX, height / 2, layout)}
</svg>`;
}

async function writeSvg(filePath, svg) {
  await fs.writeFile(filePath, svg, "utf8");
}

async function writePng(filePath, svg, width, height) {
  await sharp(Buffer.from(svg)).resize(width, height, { fit: "fill" }).png().toFile(filePath);
}

async function syncToApp(outDir) {
  await Promise.all(
    APP_ICON_PATHS.map(async ([from, to]) => {
      const src = path.join(outDir, from);
      const dest = path.join(REPO, to);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
    }),
  );
}

async function main() {
  const dirs = [OUT, path.join(OUT, "svg"), path.join(OUT, "png"), path.join(OUT, "favicon"), path.join(OUT, "social")];
  await Promise.all(dirs.map((d) => fs.mkdir(d, { recursive: true })));

  const iconPink = await iconSvg({ withBackground: true, padRatio: 0.16 });
  const iconTransparent = await iconSvg({ withBackground: false, padRatio: 0.08 });
  const stackedLogo = await stackedLogoSvg(1080, 1350);
  const wordmarkOnly = await wordmarkOnlySvg(1200, 320, 148);
  const og = await stackedLogoSvg(1200, 630);
  const twitter = await horizontalBannerSvg(1500, 500);
  const facebook = await stackedLogoSvg(1200, 630);

  await writeSvg(path.join(OUT, "svg", "icon-black-on-pink.svg"), iconPink);
  await writeSvg(path.join(OUT, "svg", "icon-black-transparent.svg"), iconTransparent);
  await writeSvg(path.join(OUT, "svg", "logo-stacked.svg"), stackedLogo);
  await writeSvg(path.join(OUT, "svg", "wordmark-only.svg"), wordmarkOnly);
  await writeSvg(path.join(OUT, "svg", "og-image.svg"), og);
  await writeSvg(path.join(OUT, "svg", "twitter-banner.svg"), twitter);
  await writeSvg(path.join(OUT, "svg", "facebook-banner.svg"), facebook);

  const exports = [
    [path.join(OUT, "png", "icon-1024.png"), iconPink, 1024, 1024],
    [path.join(OUT, "png", "icon-512.png"), iconPink, 512, 512],
    [path.join(OUT, "png", "logo-stacked-1080x1350.png"), stackedLogo, 1080, 1350],
    [path.join(OUT, "png", "wordmark-only.png"), wordmarkOnly, 1200, 320],
    [path.join(OUT, "social", "instagram-profile-1080.png"), iconPink, 1080, 1080],
    [path.join(OUT, "social", "instagram-icon-1080.png"), iconPink, 1080, 1080],
    [path.join(OUT, "social", "og-image-1200x630.png"), og, 1200, 630],
    [path.join(OUT, "social", "twitter-banner-1500x500.png"), twitter, 1500, 500],
    [path.join(OUT, "social", "facebook-banner-1200x630.png"), facebook, 1200, 630],
    [path.join(OUT, "favicon", "apple-touch-icon-180.png"), iconPink, 180, 180],
    [path.join(OUT, "favicon", "favicon-32.png"), iconPink, 32, 32],
    [path.join(OUT, "favicon", "favicon-48.png"), iconPink, 48, 48],
    [path.join(OUT, "favicon", "icon-192.png"), iconPink, 192, 192],
    [path.join(OUT, "favicon", "icon-512.png"), iconPink, 512, 512],
  ];

  for (const [file, svg, w, h] of exports) {
    await writePng(file, svg, w, h);
  }

  const fav16 = await sharp(Buffer.from(iconPink)).resize(256, 256).resize(16, 16).png().toBuffer();
  const fav32 = await sharp(Buffer.from(iconPink)).resize(256, 256).resize(32, 32).png().toBuffer();
  const fav48 = await sharp(Buffer.from(iconPink)).resize(256, 256).resize(48, 48).png().toBuffer();
  await fs.writeFile(path.join(OUT, "favicon", "favicon.ico"), await toIco([fav16, fav32, fav48]));

  const box = await computeMarkBox();
  const readme = `STARSPIN Brand Preview v2
========================

Colors
- Background: ${BRAND.pink}
- Mark:       ${BRAND.mark} (black)
- Wordmark:   Bruno Ace

Instagram
- social/instagram-profile-1080.png  (icon only, no wordmark)
- social/instagram-icon-1080.png     (same — icon only)

Wordmark
- png/wordmark-only.png
- png/logo-stacked-1080x1350.png (icon + wordmark)

Mark bounds (auto-trimmed): x=${Math.round(box.x)} y=${Math.round(box.y)} w=${box.width} h=${box.height}

Preview only — live app assets NOT changed.
`;

  await fs.writeFile(path.join(OUT, "README.txt"), readme, "utf8");
  console.log(`Preview pack written to:\n${OUT}`);

  if (process.argv.includes("--sync")) {
    await syncToApp(OUT);
    console.log("Synced favicon, PWA, and social images into src/app and public/");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
