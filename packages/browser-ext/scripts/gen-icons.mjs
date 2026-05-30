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

// Token scanner mark — amber scan beam crossing code lines on dark navy.
// Reads as a bright amber stripe at 16px; full detail at 128px.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <radialGradient id="bg" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#151829"/>
      <stop offset="100%" stop-color="#0d0e1a"/>
    </radialGradient>
  </defs>
  <!-- background -->
  <rect width="128" height="128" rx="22" fill="url(#bg)"/>
  <!-- code lines -->
  <rect x="18" y="20" width="58" height="8" rx="4" fill="#1e2348"/>
  <rect x="18" y="35" width="44" height="8" rx="4" fill="#1e2348"/>
  <rect x="18" y="50" width="70" height="8" rx="4" fill="#1e2348"/>
  <rect x="18" y="65" width="36" height="8" rx="4" fill="#1e2348"/>
  <rect x="18" y="80" width="52" height="8" rx="4" fill="#1e2348"/>
  <!-- scan glow band -->
  <rect x="8" y="44" width="96" height="20" rx="6" fill="#F5A623" opacity="0.08"/>
  <!-- active line highlight -->
  <rect x="18" y="50" width="70" height="8" rx="4" fill="#F5A623" opacity="0.5"/>
  <!-- scan line -->
  <line x1="8" y1="54" x2="104" y2="54" stroke="#F5A623" stroke-width="3" stroke-linecap="round"/>
  <!-- scan head: outer ring + white core -->
  <circle cx="104" cy="54" r="5.5" fill="#F5A623"/>
  <circle cx="104" cy="54" r="2.5" fill="#ffffff"/>
  <!-- token count badge -->
  <rect x="74" y="90" width="42" height="24" rx="7" fill="#F5A623"/>
  <text x="95" y="106" text-anchor="middle" fill="#0d0e1a"
        font-size="13" font-family="monospace" font-weight="bold" letter-spacing="-0.5">8.2k</text>
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
