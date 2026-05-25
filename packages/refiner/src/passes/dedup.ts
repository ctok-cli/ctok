import type { PassResult, PassSuggestion } from "../types";

const SHINGLE_SIZE = 4; // 4-word shingles
const OVERLAP_THRESHOLD = 0.8; // 80% overlap = duplicate

/** Split text into paragraphs / blocks (blank-line-separated or code-fence-separated). */
function splitBlocks(text: string): string[] {
  // Split on double newlines, code fences are treated as their own blocks
  const raw = text.split(/\n{2,}/).map((b) => b.trim()).filter((b) => b.length > 0);
  return raw;
}

/** Build a set of n-word shingles from a text block. */
function buildShingles(text: string, n: number): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const shingles = new Set<string>();
  for (let i = 0; i <= words.length - n; i++) {
    shingles.add(words.slice(i, i + n).join(" "));
  }
  return shingles;
}

/** Jaccard similarity between two shingle sets. */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const s of a) {
    if (b.has(s)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return intersection / union;
}

function truncateForLabel(text: string, maxLen = 60): string {
  const single = text.replace(/\n+/g, " ").trim();
  if (single.length <= maxLen) return single;
  return single.slice(0, maxLen - 1) + "…";
}

export function dedup(prompt: string): PassResult {
  const blocks = splitBlocks(prompt);
  const suggestions: PassSuggestion[] = [];

  if (blocks.length < 2) {
    return {
      pass: "dedup",
      name: "Duplicate block detection",
      applied: false,
      suggestions: [],
      tokenDelta: 0,
    };
  }

  // Pre-compute shingles for every block that has enough words
  const shingles = blocks.map((b) => buildShingles(b, SHINGLE_SIZE));

  const flagged = new Set<number>(); // block indices already flagged as duplicates

  for (let i = 0; i < blocks.length; i++) {
    if (flagged.has(i)) continue;
    if (shingles[i].size < SHINGLE_SIZE) continue; // too short to fingerprint

    for (let j = i + 1; j < blocks.length; j++) {
      if (flagged.has(j)) continue;
      if (shingles[j].size < SHINGLE_SIZE) continue;

      const sim = jaccardSimilarity(shingles[i], shingles[j]);
      if (sim >= OVERLAP_THRESHOLD) {
        flagged.add(j); // later block is the duplicate
        const tokenDelta = -Math.round(blocks[j].length / 4);
        suggestions.push({
          label: `Remove duplicate block: "${truncateForLabel(blocks[j])}"`,
          original: blocks[j],
          replacement: "",
          reason: `This block is ${Math.round(sim * 100)}% similar to an earlier block. Keeping one is sufficient.`,
          tokenDelta,
        });
      }
    }
  }

  const tokenDelta = suggestions.reduce((s, sg) => s + sg.tokenDelta, 0);

  return {
    pass: "dedup",
    name: "Duplicate block detection",
    applied: suggestions.length > 0,
    suggestions,
    tokenDelta,
  };
}

/** Apply the pass: remove duplicate blocks from the prompt. */
export function applyDedup(prompt: string): string {
  const result = dedup(prompt);
  if (!result.applied) return prompt;

  let working = prompt;
  for (const sg of result.suggestions) {
    // Remove the duplicate block and the surrounding blank lines
    working = working.replace(new RegExp(`\n*${escapeRegex(sg.original)}\n*`, "g"), "\n\n");
  }
  return working.replace(/\n{3,}/g, "\n\n").trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
