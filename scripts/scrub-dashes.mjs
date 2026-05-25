#!/usr/bin/env node
// Replace em-dash (U+2014) and en-dash (U+2013) with hyphen-minus in
// markdown and package.json files. Skip build artifacts and deps.

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const root = process.cwd();
const skipDirs = [
  "node_modules", ".git", "dist", ".next", ".turbo",
  "build", "coverage", ".astro", "out", "target", ".gradle",
  ".kotlin", ".intellijPlatform",
];

function listTrackedFiles() {
  const out = execSync("git ls-files", { cwd: root, encoding: "utf8" });
  return out.split(/\r?\n/).filter(Boolean);
}

const files = listTrackedFiles().filter((p) => {
  if (!/\.(md|json)$/i.test(p)) return false;
  if (skipDirs.some((d) => p.split("/").includes(d))) return false;
  // Only touch package.json among JSON files
  if (p.endsWith(".json") && !p.endsWith("package.json")) return false;
  return true;
});

let touched = 0;
let totalReplaced = 0;
for (const rel of files) {
  const text = readFileSync(rel, "utf8");
  const replaced = text.replace(/—/g, "-").replace(/–/g, "-");
  if (replaced !== text) {
    const before = (text.match(/[–—]/g) || []).length;
    writeFileSync(rel, replaced, "utf8");
    touched++;
    totalReplaced += before;
    console.log(`  ${rel}  (${before} replacements)`);
  }
}
console.log(`\nDone. ${touched} files updated, ${totalReplaced} dashes replaced.`);
