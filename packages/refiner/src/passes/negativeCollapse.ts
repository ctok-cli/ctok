import type { PassResult, PassSuggestion } from "../types";

/**
 * Detects scattered "don't do X" / "do not do Y" / "avoid Z" instructions
 * and collapses them into a single "Do NOT:" bullet list.
 *
 * Two modes:
 *  1. Inline negatives: "don't use classes, don't add comments, don't use var"
 *  2. Sentence negatives: separate sentences starting with don't/do not/avoid/never/no X
 */

/**
 * Matches any negative instruction regardless of sentence position.
 * Non-greedy capture stops at the next negative keyword or sentence boundary.
 */
const NEGATIVE_ITEM_RE =
  /(?:don'?t|do\s+not|avoid|never)\s+(.+?)(?=\s+(?:and\s+)?(?:don'?t|do\s+not|avoid|never)\s|\s*[.!?\n;]|$)/gi;

/** Minimum number of negatives before we suggest collapsing. */
const MIN_NEGATIVES = 2;

function extractNegativeItems(prompt: string): string[] {
  const items: string[] = [];
  const seen = new Set<string>();

  let m: RegExpExecArray | null;
  NEGATIVE_ITEM_RE.lastIndex = 0;
  while ((m = NEGATIVE_ITEM_RE.exec(prompt)) !== null) {
    const raw = m[0]; // full match including the keyword
    const item = raw.replace(/[.!?]+$/, "").trim();
    const key = item.toLowerCase().replace(/\s+/g, " ");
    if (!seen.has(key) && item.length > 3) {
      seen.add(key);
      items.push(item);
    }
  }

  return items;
}

/** Find the span in the prompt that contains all the negative sentences. */
function findNegativeSpan(prompt: string, items: string[]): { original: string; start: number; end: number } | null {
  if (items.length === 0) return null;

  // Find positions of each item in the prompt
  const positions: number[] = [];
  for (const item of items) {
    const idx = prompt.toLowerCase().indexOf(item.toLowerCase());
    if (idx !== -1) positions.push(idx);
  }
  if (positions.length === 0) return null;

  const start = Math.max(0, Math.min(...positions) - 20);
  const end = Math.min(prompt.length, Math.max(...positions.map((p) => p + 100)));

  return { original: prompt.slice(start, end), start, end };
}

function buildCollapsed(items: string[]): string {
  const bullets = items.map((item) => `- ${item}`).join("\n");
  return `Do NOT:\n${bullets}`;
}

export function negativeCollapse(prompt: string): PassResult {
  const items = extractNegativeItems(prompt);

  if (items.length < MIN_NEGATIVES) {
    return {
      pass: "negativeCollapse",
      name: "Negative instruction collapse",
      applied: false,
      suggestions: [],
      tokenDelta: 0,
    };
  }

  const collapsed = buildCollapsed(items);
  const span = findNegativeSpan(prompt, items);

  const suggestion: PassSuggestion = {
    label: `Collapse ${items.length} scattered "don't" instructions into a Do NOT list`,
    original: span?.original ?? items.join(", "),
    replacement: collapsed,
    reason:
      "Bullet-listed negatives are clearer to the model than scattered prose — reduces the risk of the model missing a constraint.",
    tokenDelta: 0, // same token count; benefit is clarity not compression
  };

  return {
    pass: "negativeCollapse",
    name: "Negative instruction collapse",
    applied: true,
    suggestions: [suggestion],
    tokenDelta: 0,
  };
}

export function applyNegativeCollapse(prompt: string): string {
  const items = extractNegativeItems(prompt);
  if (items.length < MIN_NEGATIVES) return prompt;

  const collapsed = buildCollapsed(items);
  let working = prompt;

  // Remove each matched negative instruction from the text
  NEGATIVE_ITEM_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  const toRemove: string[] = [];
  while ((m = NEGATIVE_ITEM_RE.exec(prompt)) !== null) {
    if (m[0].trim().length > 0) toRemove.push(m[0]);
  }

  for (const match of toRemove) {
    working = working.replace(match, " ").replace(/ {2,}/g, " ");
  }

  working = working.trim() + "\n\n" + collapsed;
  return working;
}
