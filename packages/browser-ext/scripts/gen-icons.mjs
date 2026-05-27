// Generate PNG extension icons from the ctok brand mark.
// Output: icons/16.png, 32.png, 48.png, 128.png
//
// Run from the workspace root because we share `sharp` with the docs deploy:
//   node packages/browser-ext/scripts/gen-icons.mjs

import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ICON_DIR = resolve(here, "..", "icons");
mkdirSync(ICON_DIR, { recursive: true });

// Square mark, lightning bolt on the brand orange. SVG is rendered at the
// largest size then downscaled by sharp for crisp small-pixel output.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#c97a3a"/>
  <path d="M19 4L10 18h7l-2 10 11-14h-7l2-10z" fill="#ffffff"/>
</svg>`;

const SIZES = [16, 32, 48, 128];

for (const size of SIZES) {
  const out = resolve(ICON_DIR, `${size}.png`);
  const buf = await sharp(Buffer.from(svg))
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(out, buf);
  console.log(`  icons/${size}.png  (${buf.length} bytes)`);
}
