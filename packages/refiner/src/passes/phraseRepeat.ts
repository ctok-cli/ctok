import type { PassResult, PassSuggestion } from "../types";

/**
 * Phrase-level dedup. Where the paragraph-level `dedup` pass catches whole
 * blocks pasted twice, this catches the smaller case: a 4-word-plus phrase
 * repeated inside the same paragraph (often the same sentence). Common
 * source: typing fatigue, e.g.
 *   "check this README and run the project and start the project and run
 *    the project on local setup"
 * Here "run the project" appears three times.
 *
 * Strategy:
 *   1. Tokenise into words while remembering original spacing.
 *   2. For window sizes 4..8 (capped to keep noise low), scan for any
 *      n-gram whose lower-cased form appears more than once.
 *   3. For each repeated n-gram, suggest deleting every occurrence after
 *      the first. Greedy: pick the longest matching n-gram for each repeat
 *      so we don't double-count overlapping ones.
 */

const MIN_NGRAM = 4;
const MAX_NGRAM = 8;

function tokenise(text: string): string[] {
  const out: string[] = [];
  // Split into words and gaps. Word = run of \w/punctuation, gap = whitespace.
  const re = /(\s+|[^\s]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(m[1]);
  return out;
}

function wordOnly(tokens: string[]): string[] {
  return tokens.filter((t) => !/^\s+$/.test(t));
}

function lower(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function phraseRepeat(prompt: string): PassResult {
  const tokens = wordOnly(tokenise(prompt));
  if (tokens.length < MIN_NGRAM * 2) {
    return { pass: "phraseRepeat", name: "Phrase repetition", applied: false, suggestions: [], tokenDelta: 0 };
  }

  const suggestions: PassSuggestion[] = [];
  const seen = new Set<string>(); // n-grams already reported

  // Largest n first so a 6-gram match wins over its 4-gram sub-match
  for (let n = MAX_NGRAM; n >= MIN_NGRAM; n--) {
    const counts = new Map<string, number>();
    for (let i = 0; i <= tokens.length - n; i++) {
      const ngram = lower(tokens.slice(i, i + n).join(" "));
      if (ngram.split(/\s+/).length < n) continue; // skip if collapse trimmed too much
      counts.set(ngram, (counts.get(ngram) ?? 0) + 1);
    }
    for (const [ngram, count] of counts) {
      if (count < 2) continue;
      if (seen.has(ngram)) continue;
      // Skip if this n-gram is contained in a longer one we already flagged
      let containedInLonger = false;
      for (const prev of seen) {
        if (prev.includes(ngram)) { containedInLonger = true; break; }
      }
      if (containedInLonger) continue;
      seen.add(ngram);

      const phraseLen = ngram.length;
      const tokenDelta = -Math.round((phraseLen * (count - 1)) / 4);
      suggestions.push({
        label: `Remove ${count - 1} repeat${count > 2 ? "s" : ""} of "${ngram}"`,
        original: ngram,
        replacement: "",
        reason: `"${ngram}" appears ${count} times. Keep one and drop the rest, or restructure the sentence as a list.`,
        tokenDelta,
      });
    }
  }

  const tokenDelta = suggestions.reduce((s, sg) => s + sg.tokenDelta, 0);
  return {
    pass: "phraseRepeat",
    name: "Phrase repetition",
    applied: suggestions.length > 0,
    suggestions,
    tokenDelta,
  };
}

/**
 * Apply: for every repeated phrase, remove all occurrences after the first.
 * Conservative: only collapses when the phrase appears surrounded by " and ",
 * " or ", " then ", or " plus " on at least one side - otherwise removal is
 * likely to break grammar.
 */
export function applyPhraseRepeat(prompt: string): string {
  const result = phraseRepeat(prompt);
  if (!result.applied) return prompt;

  let working = prompt;
  for (const sg of result.suggestions) {
    const phrase = sg.original;
    if (!phrase) continue;
    // Build a regex that matches the phrase with " and "/" or "/" then " on at
    // least one side. Replace each repeat (the 2nd+ match) with empty string,
    // including its leading connective.
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?:\\s+(?:and|or|then|plus)\\s+)${escaped}(?![\\w])`, "gi");
    let first = true;
    working = working.replace(re, (match) => {
      // Keep the very first occurrence as it appears (since the regex requires
      // a leading connective the very first hit might or might not be
      // grammatically "first"). To be safe we keep one match and strip the rest.
      if (first) { first = false; return match; }
      return "";
    });
  }
  // Tidy up double spaces and trailing connectives a removal might have left
  working = working
    .replace(/\s+(and|or|then|plus)\s*([.!?,;])/gi, "$2")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([.!?,;])/g, "$1");
  return working;
}
