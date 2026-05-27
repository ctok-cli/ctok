/**
 * Assembles the distributable extension zip from dist/ + manifest.json + popup.html + icons/.
 * Run: node scripts/package.mjs
 * Output: ctok-ext-<version>.zip  (Chrome/Edge)
 *         ctok-ext-<version>-firefox.zip  (Firefox AMO - identical for MV3)
 */
import { createWriteStream, readFileSync, readdirSync, statSync, cpSync, mkdirSync, rmSync } from "fs";
import { resolve, join, relative } from "path";
import { execSync } from "child_process";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const manifest = JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf8"));
const version = manifest.version;

const STAGING = join(ROOT, ".staging");
rmSync(STAGING, { recursive: true, force: true });
mkdirSync(STAGING, { recursive: true });

// Copy required files into staging
const INCLUDE = ["manifest.json", "popup.html", "dist", "icons"];
for (const item of INCLUDE) {
  const src = join(ROOT, item);
  const dst = join(STAGING, item);
  try {
    cpSync(src, dst, { recursive: true });
  } catch {
    // icons may not exist yet (placeholder); skip
  }
}

// Check zip command availability
function hasCommand(cmd) {
  try { execSync(`${cmd} --version`, { stdio: "ignore" }); return true; } catch { return false; }
}

const outChrome = join(ROOT, `ctok-ext-${version}.zip`);
const outFirefox = join(ROOT, `ctok-ext-${version}-firefox.zip`);

if (hasCommand("zip")) {
  execSync(`zip -r "${outChrome}" .`, { cwd: STAGING, stdio: "inherit" });
  execSync(`cp "${outChrome}" "${outFirefox}"`, { stdio: "inherit" });
} else {
  // Windows fallback: PowerShell Compress-Archive
  execSync(
    `powershell -Command "Compress-Archive -Path '${STAGING}\\*' -DestinationPath '${outChrome}' -Force"`,
    { stdio: "inherit" },
  );
  execSync(
    `powershell -Command "Copy-Item '${outChrome}' '${outFirefox}'"`,
    { stdio: "inherit" },
  );
}

rmSync(STAGING, { recursive: true, force: true });

console.log(`\nPackaged:`);
console.log(`  Chrome/Edge: ctok-ext-${version}.zip`);
console.log(`  Firefox AMO: ctok-ext-${version}-firefox.zip`);
