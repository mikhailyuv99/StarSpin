import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public", "prize-icons");
const ATTR = path.join(OUT, "ATTRIBUTION.txt");

/** 10 columns × 5 rows — matching the Vecteezy cute food sheet */
const IDS = [
  // row 1
  "pizza_slice",
  "sausage",
  "popsicle",
  "broccoli",
  "carrot",
  "cookie",
  "onigiri",
  "apple",
  "soda",
  "pineapple",
  // row 2
  "strawberry",
  "cupcake",
  "banana",
  "donut_choco",
  "popsicle_blue",
  "donut_pink",
  "fries",
  "sushi",
  "peas",
  "birthday_cake",
  // row 3
  "cherries",
  "toast",
  "eggplant",
  "radish",
  "jam",
  "corn",
  "ice_cream_cone",
  "burrito",
  "bacon",
  "chicken",
  // row 4
  "peach",
  "pudding",
  "orange",
  "fried_egg",
  "chili",
  "donut_sprinkle",
  "hotdog",
  "burger_cute",
  "avocado",
  "pizza_whole",
  // row 5
  "bell_pepper",
  "mushroom",
  "salad",
  "lime",
  "tier_cake",
  "smoothie",
  "macaron",
  "grapes",
  "ketchup",
  "coffee_cup",
];

const COLS = 10;
const ROWS = 5;

async function trimCell(buf) {
  // Alpha-trim white-ish background leftover from grid
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      // treat near-white / near-transparent as empty
      const white = r > 245 && g > 245 && b > 245;
      if (a < 18 || white) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX) return null;
  // pad a bit so outlines aren't clipped
  const pad = Math.max(2, Math.round(Math.min(width, height) * 0.04));
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const tw = maxX - minX + 1;
  const th = maxY - minY + 1;
  // square canvas, centered
  const side = Math.max(tw, th);
  const left = Math.floor((side - tw) / 2);
  const top = Math.floor((side - th) / 2);

  const cropped = await sharp(buf)
    .extract({ left: minX, top: minY, width: tw, height: th })
    .ensureAlpha()
    .toBuffer();

  return sharp({
    create: {
      width: side,
      height: side,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: cropped, left, top }])
    .png()
    .toBuffer();
}

async function main() {
  const sheetPath = process.argv[2];
  if (!sheetPath) {
    console.error("Usage: node slice-cute-icons.mjs <sheet.png>");
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });

  const meta = await sharp(sheetPath).metadata();
  const W = meta.width;
  const H = meta.height;
  const cellW = W / COLS;
  const cellH = H / ROWS;
  console.log(`Sheet ${W}x${H} → cell ~${cellW.toFixed(1)}x${cellH.toFixed(1)}`);

  // Inset each cell to avoid grid borders
  const insetX = cellW * 0.04;
  const insetY = cellH * 0.04;

  for (let i = 0; i < IDS.length; i++) {
    const id = IDS[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const left = Math.round(col * cellW + insetX);
    const top = Math.round(row * cellH + insetY);
    const width = Math.round(cellW - insetX * 2);
    const height = Math.round(cellH - insetY * 2);

    const cell = await sharp(sheetPath)
      .extract({ left, top, width, height })
      .ensureAlpha()
      // knock out near-white to transparency before trim
      .raw()
      .toBuffer({ resolveWithObject: true });

    const rgba = Buffer.from(cell.data);
    for (let p = 0; p < rgba.length; p += 4) {
      if (rgba[p] > 248 && rgba[p + 1] > 248 && rgba[p + 2] > 248) {
        rgba[p + 3] = 0;
      }
    }
    const transparentCell = await sharp(rgba, {
      raw: { width: cell.info.width, height: cell.info.height, channels: 4 },
    })
      .png()
      .toBuffer();

    const trimmed = await trimCell(transparentCell);
    if (!trimmed) {
      console.warn("skip empty", id);
      continue;
    }

    const outPng = path.join(OUT, `${id}.png`);
    const outWebp = path.join(OUT, `${id}.webp`);
    await sharp(trimmed).resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(outPng);
    await sharp(trimmed).resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 90 }).toFile(outWebp);
    console.log("✓", id);
  }

  fs.writeFileSync(
    ATTR,
    [
      "Cute food icon pack from Vecteezy.",
      "Source file: GIU JEN 753-51.eps",
      "Attribution required under Vecteezy Free License: Vecteezy.com",
      "https://www.vecteezy.com/",
      "",
    ].join("\n"),
  );
  console.log("Wrote", IDS.length, "icons to", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
