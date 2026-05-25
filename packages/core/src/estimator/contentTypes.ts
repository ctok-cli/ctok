import type { ContentKind } from "../types";

const CODE_SIGNALS = [
  /\b(function|const|let|var|class|interface|type|enum|import|export|return|async|await)\b/,
  /\b(def|class|import|from|return|if __name__|self\.)\b/,
  /\b(public|private|protected|static|void|null|new |throw |catch)\b/,
  /[{};]\s*$/m,
  /=>/,
  /\)\s*\{/,
];

const JSON_SIGNALS = [/^\s*[\[{]/, /"[^"]+"\s*:/];
const MARKDOWN_SIGNALS = [/^#{1,6}\s+\w/m, /^\s*[-*+]\s+\w/m, /^\s*```/m];
const DIFF_SIGNALS = [/^@@\s+-\d/m, /^\+\+\+ /m, /^--- /m, /^[+-][^+-]/m];
const LOG_SIGNALS = [
  /\b(ERROR|WARN|INFO|DEBUG|TRACE|FATAL)\b/,
  /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/,
  /\bat\s+[\w$.<>]+\(.+:\d+:\d+\)/,
  /\bTraceback \(most recent call last\)/,
];

export function classify(text: string, hintExt?: string): ContentKind {
  if (!text) return "prose";
  const sample = text.length > 4000 ? text.slice(0, 4000) : text;
  const lineCount = sample.split("\n").length;
  const avgLineLen = sample.length / Math.max(1, lineCount);

  if (avgLineLen > 400 && /[{};]/.test(sample)) return "minified";

  if (hintExt) {
    const ext = hintExt.toLowerCase().replace(/^\./, "");
    if (["json", "ndjson"].includes(ext)) return "json";
    if (["md", "mdx", "markdown"].includes(ext)) return "markdown";
    if (["log", "txt"].includes(ext) && countMatches(sample, LOG_SIGNALS) >= 1)
      return "log";
    if (["patch", "diff"].includes(ext)) return "diff";
    if (
      [
        "ts", "tsx", "js", "jsx", "mjs", "cjs", "py", "rb", "go", "rs",
        "java", "kt", "swift", "cs", "cpp", "c", "h", "hpp", "php",
        "scala", "sh", "bash", "ps1", "sql", "html", "css", "scss", "vue", "svelte",
      ].includes(ext)
    )
      return "code";
  }

  if (countMatches(sample, DIFF_SIGNALS) >= 2) return "diff";
  if (countMatches(sample, JSON_SIGNALS) >= 2 && /[\[{]/.test(sample[0] ?? ""))
    return "json";
  if (countMatches(sample, LOG_SIGNALS) >= 2) return "log";
  if (countMatches(sample, MARKDOWN_SIGNALS) >= 1) return "markdown";
  if (countMatches(sample, CODE_SIGNALS) >= 2) return "code";

  return "prose";
}

function countMatches(s: string, patterns: RegExp[]): number {
  let n = 0;
  for (const p of patterns) if (p.test(s)) n++;
  return n;
}

// Heuristic char-per-token ratios calibrated from public Claude tokenizer
// behavior. Real tokenization varies; these are deliberately conservative.
// Lower ratio = more tokens per char.
export const CHARS_PER_TOKEN: Record<ContentKind, number> = {
  prose: 3.8,
  markdown: 3.5,
  code: 2.9,
  json: 2.3,
  diff: 2.6,
  log: 3.2,
  minified: 2.0,
};

// Multiplier applied to symbol/whitespace-heavy chunks for variance.
export const RATIO_VARIANCE: Record<ContentKind, number> = {
  prose: 0.08,
  markdown: 0.1,
  code: 0.15,
  json: 0.12,
  diff: 0.18,
  log: 0.12,
  minified: 0.2,
};
