#!/usr/bin/env node
// Add publish metadata (publishConfig, license, repository, homepage, bugs,
// keywords, author) to the 7 public @ctok packages.

import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const PUBLIC_PKGS = [
  "packages/core/package.json",
  "packages/scanner/package.json",
  "packages/refiner/package.json",
  "packages/refiner-llm/package.json",
  "packages/quota/package.json",
  "packages/cli/package.json",
  "packages/mcp/package.json",
];

const REPO_URL = "https://github.com/ctok-cli/ctok";

const KEYWORDS = {
  core: ["claude", "tokens", "anthropic", "estimator", "llm", "pricing"],
  scanner: ["claude", "tokens", "scanner", "monorepo", "project-detection"],
  refiner: ["claude", "prompt", "refiner", "tokens", "heuristics"],
  "refiner-llm": ["claude", "prompt", "refiner", "ai-sdk", "vercel-ai-gateway"],
  quota: ["claude", "quota", "anthropic", "plan-limits", "rate-limit"],
  cli: ["claude", "tokens", "cli", "anthropic", "ctok", "prompt-engineering"],
  mcp: ["claude", "mcp", "model-context-protocol", "anthropic", "ctok"],
};

for (const path of PUBLIC_PKGS) {
  const text = readFileSync(path, "utf8");
  const pkg = JSON.parse(text);
  if (pkg.private) {
    console.log(`  ${path}  SKIP (private)`);
    continue;
  }

  const dir = path.split("/").slice(0, -1).join("/");
  const pkgKey = basename(dir);

  pkg.license = "MIT";
  pkg.author = "ctok contributors";
  pkg.homepage = `${REPO_URL}#readme`;
  pkg.repository = { type: "git", url: `git+${REPO_URL}.git`, directory: dir };
  pkg.bugs = { url: `${REPO_URL}/issues` };
  if (KEYWORDS[pkgKey]) pkg.keywords = KEYWORDS[pkgKey];
  pkg.publishConfig = { access: "public", ...(pkg.publishConfig || {}) };

  // Reorder for npm-readable field order
  const front = [
    "name", "version", "description",
    "license", "author", "homepage", "repository", "bugs", "keywords",
    "publishConfig",
    "main", "module", "types", "bin", "exports", "files",
    "scripts", "dependencies", "devDependencies", "peerDependencies",
  ];
  const ordered = {};
  for (const k of front) if (k in pkg) ordered[k] = pkg[k];
  for (const k of Object.keys(pkg)) if (!(k in ordered)) ordered[k] = pkg[k];

  writeFileSync(path, JSON.stringify(ordered, null, 2) + "\n", "utf8");
  console.log(`  ${path}  updated`);
}
