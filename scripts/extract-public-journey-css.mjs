import fs from "fs";

const css = fs.readFileSync("src/app/globals.css", "utf8");
const lines = css.split(/\n/);

const locStart = lines.findIndex((l) => l.startsWith(".locale-switcher {"));
const pubStart = lines.findIndex((l) => l.includes("Client QR flow"));
const reducedIdx = lines.findIndex(
  (l, i) => i > pubStart && l.includes("Respect reduced-motion"),
);

if (locStart < 0 || pubStart < 0 || reducedIdx < 0) {
  throw new Error("Could not locate public journey CSS markers in globals.css");
}

let depth = 0;
let reducedEnd = reducedIdx;
for (let i = reducedIdx; i < lines.length; i++) {
  depth += (lines[i].match(/{/g) || []).length;
  depth -= (lines[i].match(/}/g) || []).length;
  if (i > reducedIdx && depth === 0) {
    reducedEnd = i;
    break;
  }
}

const head = lines.slice(0, 67).join("\n");
const zeroShadow = `*,
*::before,
*::after {
  box-shadow: none !important;
  text-shadow: none !important;
}

.public-flow .public-card,
.public-flow .public-btn,
.public-flow .public-btn:hover,
.public-flow .public-btn:active,
.public-flow .public-pill,
.public-flow .public-input,
.public-flow .public-input:focus,
.public-flow .locale-switcher-trigger--journey,
.public-flow .locale-switcher-trigger--journey:hover,
.public-flow .locale-switcher-menu--journey {
  box-shadow: none !important;
}`;

const loc = lines.slice(locStart, pubStart).join("\n");
const pub = lines.slice(pubStart, reducedEnd + 1).join("\n");

const out = `${head}

${zeroShadow}

${loc}

${pub}

@media (pointer: coarse) {
  .public-btn,
  .public-touch-target {
    min-height: 48px;
  }
}
`;

fs.writeFileSync("src/app/public-journey.css", out);
console.log({
  locStart,
  pubStart,
  reducedEnd,
  bytes: out.length,
  lines: out.split(/\n/).length,
});
