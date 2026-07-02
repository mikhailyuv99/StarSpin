import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import toIco from "to-ico";

const BRAND = {
  purple: "#9b7fe8",
  yellow: "#f5e08e",
  black: "#0a0a0a",
};

const OUT = path.join(process.env.USERPROFILE ?? "", "Desktop", "SpinStar Branding");

/** Yellow star only — no orbit ring, no frame, no dot. */
const STAR_PATH = `M20 7.5 22.4 14.8 30 14.8 23.8 19.2 26.2 26.5 20 22.2 13.8 26.5 16.2 19.2 10 14.8 17.6 14.8Z`;

function starGroupAt(scale, cx, cy) {
  return `<g transform="translate(${cx}, ${cy}) scale(${scale}) translate(-20, -20)">
    <path d="${STAR_PATH}" fill="${BRAND.yellow}" stroke="${BRAND.black}" stroke-width="2.25" stroke-linejoin="round"/>
  </g>`;
}

function purpleBg(width, height) {
  return `<rect width="${width}" height="${height}" fill="${BRAND.purple}"/>`;
}

// Star path bounds inside the 40×40 viewBox (not the full viewBox).
const STAR_VISUAL_WIDTH = 20;
const STAR_VISUAL_HEIGHT = 19;
const PADDING = 0.06;

function starScaleForInner(inner) {
  return Math.min(inner / STAR_VISUAL_WIDTH, inner / STAR_VISUAL_HEIGHT) * 0.98;
}

/** Star centered on solid purple — nothing else. */
function iconOnlySvg({ size = 1024, withBackground = true }) {
  const inner = size * (1 - PADDING * 2);
  const scale = starScaleForInner(inner);
  const cx = size / 2;
  const cy = size / 2;
  const bg = withBackground ? purpleBg(size, size) : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bg}
  ${starGroupAt(scale, cx, cy)}
</svg>`;
}

function wordmarkElements(width, height) {
  const padX = width * PADDING;
  const padY = height * PADDING;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const scale = starScaleForInner(Math.min(innerW, innerH));
  const visualStarH = STAR_VISUAL_HEIGHT * scale;
  const fontSize = Math.round(innerW * 0.14);
  const gap = fontSize * 0.42;
  const blockHeight = visualStarH + gap + fontSize;
  const blockTop = padY + (innerH - blockHeight) / 2;
  const starCy = blockTop + visualStarH / 2;
  const textY = blockTop + visualStarH + gap + fontSize * 0.88;

  return `
  ${starGroupAt(scale, width / 2, starCy)}
  <text x="${width / 2}" y="${textY}" text-anchor="middle"
    font-family="Arial Black, Impact, Haettenschweiler, sans-serif"
    font-size="${fontSize}" font-weight="900" fill="${BRAND.black}"
    letter-spacing="${Math.round(fontSize * 0.12)}">STARSPIN</text>`;
}

/** Star + STARSPIN on solid purple — no frame around the logo. */
function logoWordmarkSvg({ width = 1024, height = 1280 }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${purpleBg(width, height)}
  ${wordmarkElements(width, height)}
</svg>`;
}

/** Social banner: solid purple, wordmark centered — no boxes or borders. */
function bannerSvg({ width, height }) {
  const aspect = width / height;
  let logoW;
  let logoH;

  if (aspect > 1.4) {
    logoH = height * (1 - PADDING * 2);
    logoW = logoH * 0.82;
  } else {
    logoW = width * (1 - PADDING * 2);
    logoH = logoW * 1.22;
  }

  const x = (width - logoW) / 2;
  const y = (height - logoH) / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${purpleBg(width, height)}
  <svg x="${x}" y="${y}" width="${logoW}" height="${logoH}" viewBox="0 0 ${logoW} ${logoH}">
    ${wordmarkElements(logoW, logoH)}
  </svg>
</svg>`;
}

async function writeSvg(filePath, svg) {
  await fs.writeFile(filePath, svg, "utf8");
}

async function writePng(filePath, svg, width, height) {
  await sharp(Buffer.from(svg)).resize(width, height).png().toFile(filePath);
}

async function main() {
  const dirs = [
    OUT,
    path.join(OUT, "svg"),
    path.join(OUT, "png"),
    path.join(OUT, "favicon"),
    path.join(OUT, "pwa"),
    path.join(OUT, "social"),
  ];
  await Promise.all(dirs.map((d) => fs.mkdir(d, { recursive: true })));

  const iconSvg = iconOnlySvg({ size: 1024 });
  const iconTransparentSvg = iconOnlySvg({ size: 1024, withBackground: false });
  const logoSvg = logoWordmarkSvg({ width: 1024, height: 1280 });
  const ogSvg = bannerSvg({ width: 1200, height: 630 });
  const twitterSvg = bannerSvg({ width: 1500, height: 500 });

  await writeSvg(path.join(OUT, "svg", "icon-only.svg"), iconSvg);
  await writeSvg(path.join(OUT, "svg", "icon-only-transparent.svg"), iconTransparentSvg);
  await writeSvg(path.join(OUT, "svg", "logo-icon-wordmark.svg"), logoSvg);
  await writeSvg(path.join(OUT, "svg", "og-image.svg"), ogSvg);
  await writeSvg(path.join(OUT, "svg", "twitter-banner.svg"), twitterSvg);

  const exports = [
    [path.join(OUT, "png", "icon-only-1024.png"), iconSvg, 1024, 1024],
    [path.join(OUT, "png", "icon-only-512.png"), iconSvg, 512, 512],
    [path.join(OUT, "png", "logo-wordmark-1024.png"), logoSvg, 1024, 1280],
    [path.join(OUT, "png", "logo-wordmark-512.png"), logoSvg, 512, 640],
    [path.join(OUT, "favicon", "favicon-16x16.png"), iconSvg, 16, 16],
    [path.join(OUT, "favicon", "favicon-32x32.png"), iconSvg, 32, 32],
    [path.join(OUT, "favicon", "apple-touch-icon.png"), iconSvg, 180, 180],
    [path.join(OUT, "pwa", "icon-192x192.png"), iconSvg, 192, 192],
    [path.join(OUT, "pwa", "icon-512x512.png"), iconSvg, 512, 512],
    [path.join(OUT, "social", "instagram-profile.png"), iconSvg, 1080, 1080],
    [path.join(OUT, "social", "instagram-logo.png"), logoSvg, 1080, 1350],
    [path.join(OUT, "social", "og-image.png"), ogSvg, 1200, 630],
    [path.join(OUT, "social", "twitter-banner.png"), twitterSvg, 1500, 500],
  ];

  for (const [file, svg, w, h] of exports) {
    await writePng(file, svg, w, h);
  }

  const fav16 = await sharp(Buffer.from(iconSvg)).resize(16, 16).png().toBuffer();
  const fav32 = await sharp(Buffer.from(iconSvg)).resize(32, 32).png().toBuffer();
  const fav48 = await sharp(Buffer.from(iconSvg)).resize(48, 48).png().toBuffer();
  const ico = await toIco([fav16, fav32, fav48]);
  await fs.writeFile(path.join(OUT, "favicon", "favicon.ico"), ico);
  await fs.copyFile(path.join(OUT, "favicon", "favicon.ico"), path.join(OUT, "favicon.ico"));

  const readme = `STARSPIN Branding Pack
=====================

Design
- Solid purple background (${BRAND.purple})
- Yellow star (${BRAND.yellow}) with black stroke (${BRAND.black})
- Star only — no orbit ring, no frames, no boxes
- Wordmark version: centered star + STARSPIN text below on same purple fill

Folders
- svg/     Master vectors
- png/     High-res exports
- favicon/ Browser & Apple icons
- pwa/     192 & 512 app icons
- social/  OG, Twitter/X, Instagram

Generated for starspin.cc
`;

  await fs.writeFile(path.join(OUT, "README.txt"), readme, "utf8");
  console.log(`Branding assets written to: ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
