import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PRIZE_ICON_MANIFEST } from "./prize-icon-manifest.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public", "prize-icons");
const TWEMOJI_BASE = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72";

function emojiToFilename(emoji) {
  const cps = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0).toString(16);
    if (cp !== "fe0f") cps.push(cp);
  }
  return cps.join("-");
}

async function fetchEmojiPng(emoji) {
  const file = `${emojiToFilename(emoji)}.png`;
  const url = `${TWEMOJI_BASE}/${file}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const toFetch = PRIZE_ICON_MANIFEST.filter((e) => e.emoji);
  let ok = 0;
  let skip = 0;

  for (const entry of toFetch) {
    const outWebp = path.join(OUT, `${entry.id}.webp`);
    if (fs.existsSync(outWebp) && process.argv.includes("--missing-only")) {
      skip++;
      continue;
    }
    try {
      const png = await fetchEmojiPng(entry.emoji);
      await sharp(png)
        .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 90 })
        .toFile(outWebp);
      console.log("✓", entry.id, entry.emoji);
      ok++;
    } catch (err) {
      console.error("✗", entry.id, err.message);
    }
  }

  const attrPath = path.join(OUT, "ATTRIBUTION.txt");
  const lines = [
    "Icon sources:",
    "- Cute food pack from Vecteezy (GIU JEN 753-51) — Vecteezy.com",
    "- Additional icons from Twemoji (CC-BY 4.0) — https://github.com/twitter/twemoji",
    "",
    `Raster assets: ${PRIZE_ICON_MANIFEST.length} food/drink icons + vector offer/service marks.`,
    "",
  ];
  fs.writeFileSync(attrPath, lines.join("\n"));
  console.log(`Done. Fetched ${ok}, skipped ${skip}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
