import fs from "node:fs";
import path from "node:path";
import { MARK_ICON_IDS, PRIZE_ICON_GROUP_ORDER, PRIZE_ICON_MANIFEST } from "./prize-icon-manifest.mjs";

const OUT = path.resolve(import.meta.dirname, "..", "src", "lib", "prize-icon-assets.ts");

const manifestJson = JSON.stringify(PRIZE_ICON_MANIFEST, null, 2)
  .replace(/"([^"]+)":/g, "$1:");

const content = `/** Auto-generated from scripts/prize-icon-manifest.mjs — do not edit by hand. */

export const PRIZE_ASSET_MANIFEST = ${manifestJson} as const;

export type PrizeAssetManifestEntry = (typeof PRIZE_ASSET_MANIFEST)[number];

export const PRIZE_ICON_LABELS: Record<string, string> = Object.fromEntries(
  PRIZE_ASSET_MANIFEST.map((e) => [e.id, e.label]),
);

export const MARK_ICON_ID_LIST = ${JSON.stringify(MARK_ICON_IDS)} as const;

export const PRIZE_ICON_GROUP_ORDER = ${JSON.stringify(PRIZE_ICON_GROUP_ORDER)} as const;
`;

fs.writeFileSync(OUT, content);
console.log("Wrote", OUT);
