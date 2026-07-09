import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";

const slug = process.argv[2] || "onda-lounge";
const outDir = process.argv[3] || path.join(process.env.USERPROFILE || "", "Desktop");
const url = `https://starspin.cc/${encodeURIComponent(slug)}`;

fs.mkdirSync(outDir, { recursive: true });

const sizes = [
  { name: `${slug}-qr.png`, width: 512 },
  { name: `${slug}-qr-1024.png`, width: 1024 },
  { name: `${slug}-qr-print.png`, width: 2048 },
];

for (const { name, width } of sizes) {
  const file = path.join(outDir, name);
  await QRCode.toFile(file, url, {
    width,
    margin: 2,
    color: { dark: "#0a0a0a", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
  console.log("Wrote", file);
}

const infoPath = path.join(outDir, `${slug}-qr-info.txt`);
fs.writeFileSync(
  infoPath,
  [
    `Merchant slug: ${slug}`,
    `QR target URL: ${url}`,
    "",
    "Scan opens the STARSPIN customer journey for this venue.",
    "Note: journey may show as inactive until billing is active on production.",
  ].join("\n"),
);
console.log("Wrote", infoPath);
console.log("URL:", url);
