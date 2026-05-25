import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import ignore, { type Ignore } from "ignore";
import { estimateTokensFor } from "@ctok/core";
import { detectProjectType } from "./projectType";
import { UNIVERSAL_EXCLUDES, TEXT_EXTENSIONS } from "./excludes";
import type { ProjectScan, ScanOptions } from "./types";

const DEFAULT_MAX_FILE_BYTES = 1_048_576; // 1 MB
const DEFAULT_TOP_HEAVY_COUNT = 10;

export async function scan(options: ScanOptions = {}): Promise<ProjectScan> {
  const root = path.resolve(options.root ?? process.cwd());
  const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;
  const topHeavyCount = options.topHeavyCount ?? DEFAULT_TOP_HEAVY_COUNT;

  // 1. detect project type
  const detection = detectProjectType(root);

  // 2. build exclusion patterns
  const autoExcludes = [
    ...UNIVERSAL_EXCLUDES,
    ...detection.excludes,
    ...(options.exclude ?? []),
  ];

  // 3. build ignore filter (gitignore + ctokignore)
  const ig = buildIgnoreFilter(root, {
    gitignore: options.respectGitignore !== false,
    ctokignore: options.respectCtokignore !== false,
  });

  // 4. glob all files
  const allFiles = await fg("**/*", {
    cwd: root,
    dot: true,
    onlyFiles: true,
    followSymbolicLinks: false,
    ignore: autoExcludes,
  });

  // 5. filter + stat each file
  const included: Array<{ path: string; tokens: number; bytes: number; ext: string }> = [];
  const excluded = { files: 0, bytes: 0, reasons: {} as Record<string, number> };

  for (const rel of allFiles) {
    const abs = path.join(root, rel);
    const ext = getExt(rel);

    // Force-include overrides
    const forceIncluded =
      options.include?.some((p) => rel.startsWith(p) || rel === p) ?? false;

    // gitignore / ctokignore filter
    if (!forceIncluded && ig.ignores(rel)) {
      bump(excluded.reasons, "gitignore/.ctokignore");
      excluded.files++;
      continue;
    }

    // Extension allowlist
    if (!forceIncluded && !TEXT_EXTENSIONS.has(ext) && ext !== "") {
      bump(excluded.reasons, "binary/unknown extension");
      excluded.files++;
      continue;
    }

    // File size gate
    let stat: fs.Stats;
    try {
      stat = fs.statSync(abs);
    } catch {
      bump(excluded.reasons, "stat error");
      excluded.files++;
      continue;
    }

    if (stat.size > maxFileBytes) {
      bump(excluded.reasons, `file > ${Math.round(maxFileBytes / 1024)}KB`);
      excluded.files++;
      excluded.bytes += stat.size;
      continue;
    }

    // Read and estimate
    let content: string;
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch {
      // Binary file snuck through extension check (e.g. no extension) — skip
      bump(excluded.reasons, "read error / binary");
      excluded.files++;
      continue;
    }

    // Quick binary check: look for null bytes in first 8 KB
    if (hasBinaryContent(content)) {
      bump(excluded.reasons, "binary content");
      excluded.files++;
      excluded.bytes += stat.size;
      continue;
    }

    const { tokens } = estimateTokensFor(content, ext, rel);
    included.push({ path: rel, tokens, bytes: stat.size, ext });
  }

  // 6. aggregate stats
  const totalFiles = included.length;
  const totalBytes = included.reduce((s, f) => s + f.bytes, 0);
  const estimatedTokens = included.reduce((s, f) => s + f.tokens, 0);

  const byExtension: ProjectScan["byExtension"] = {};
  for (const f of included) {
    const key = f.ext || "(no ext)";
    if (!byExtension[key]) byExtension[key] = { files: 0, tokens: 0 };
    byExtension[key].files++;
    byExtension[key].tokens += f.tokens;
  }

  const topHeavyFiles = [...included]
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, topHeavyCount)
    .map((f) => ({ path: f.path, tokens: f.tokens }));

  return {
    root,
    projectType: detection.type,
    totalFiles,
    totalBytes,
    estimatedTokens,
    byExtension,
    topHeavyFiles,
    excluded,
  };
}

function buildIgnoreFilter(
  root: string,
  opts: { gitignore: boolean; ctokignore: boolean },
): Ignore {
  const ig = ignore();
  if (opts.gitignore) {
    const gp = path.join(root, ".gitignore");
    if (fs.existsSync(gp)) ig.add(fs.readFileSync(gp, "utf8"));
  }
  if (opts.ctokignore) {
    const cp = path.join(root, ".ctokignore");
    if (fs.existsSync(cp)) ig.add(fs.readFileSync(cp, "utf8"));
  }
  return ig;
}

function getExt(filePath: string): string {
  const base = path.basename(filePath);
  // Handle dotfiles with no extension (e.g. ".gitignore" → "gitignore")
  if (base.startsWith(".") && !base.slice(1).includes(".")) {
    return base.slice(1).toLowerCase();
  }
  const dot = base.lastIndexOf(".");
  if (dot === -1) return "";
  return base.slice(dot + 1).toLowerCase();
}

function hasBinaryContent(content: string): boolean {
  const check = content.slice(0, 8192);
  for (let i = 0; i < check.length; i++) {
    if (check.charCodeAt(i) === 0) return true;
  }
  return false;
}

function bump(record: Record<string, number>, key: string): void {
  record[key] = (record[key] ?? 0) + 1;
}
