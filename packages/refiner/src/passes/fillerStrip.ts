import type { PassResult, PassSuggestion } from "../types";

/**
 * Words and phrases that pad prompts without adding meaning.
 * Format: [pattern, replacement, reason]
 * Empty replacement = delete the word/phrase.
 */
const FILLER_RULES: Array<[RegExp, string, string]> = [
  // Politeness padding — model doesn't need manners
  [/\bplease\b[,]?\s*/gi, "", "politeness filler — model ignores it"],
  [/\bkindly\b[,]?\s*/gi, "", "politeness filler"],
  [/\bif you don'?t mind\b[,]?\s*/gi, "", "politeness filler"],
  [/\bif possible\b[,]?\s*/gi, "", "hedge — commit to the requirement instead"],
  [/\bcould you\b\s*/gi, "", "indirect phrasing — use imperative"],
  [/\bcan you\b\s*/gi, "", "indirect phrasing — use imperative"],
  [/\bwould you\b\s*/gi, "", "indirect phrasing — use imperative"],
  [/\bI was wondering if\b[,]?\s*/gi, "", "indirect phrasing — state the request directly"],
  [/\bI'd like you to\b\s*/gi, "", "indirect phrasing — use imperative"],
  [/\bI want you to\b\s*/gi, "", "indirect phrasing — use imperative"],
  [/\bI need you to\b\s*/gi, "", "indirect phrasing — use imperative"],

  // Intensifiers that inflate token count without specificity
  [/\bvery\s+/gi, "", "filler intensifier — be specific instead"],
  [/\breally\s+/gi, "", "filler intensifier"],
  [/\bquite\s+/gi, "", "filler intensifier"],
  [/\bbasically\s+/gi, "", "filler — adds no meaning"],
  [/\bactually\s+/gi, "", "filler — adds no meaning"],
  [/\bjust\s+/gi, "", "filler — adds no meaning"],
  [/\bsimply\s+/gi, "", "filler — adds no meaning"],

  // Redundant certainty/confirmation phrases
  [/\bmake sure\s+(?:to\s+)?/gi, "", "imperative is already a directive"],
  [/\bensure that\s+/gi, "", "redundant with imperative"],
  [/\bplease note that\s+/gi, "", "filler — state the fact directly"],
  [/\bit('s| is) important (that|to)\s+/gi, "", "emphasis filler — prioritize with ordering instead"],
  [/\bit should be noted that\s+/gi, "", "filler — state directly"],
  [/\bbe aware that\s+/gi, "", "filler — state directly"],

  // Hedges that lower specificity
  [/\bsomething like\s+/gi, "", "vague hedge — give a concrete example"],
  [/\balong the lines of\s+/gi, "", "vague hedge — be specific"],
  [/\band so on\b\.?/gi, "", "complete the list or remove"],
  [/\betc\.?\b/gi, "", "complete the list or remove"],
  [/\band (others|so forth)\b\.?/gi, "", "complete the list or remove"],
];

export function fillerStrip(prompt: string): PassResult {
  const suggestions: PassSuggestion[] = [];
  let working = prompt;

  for (const [pattern, replacement, reason] of FILLER_RULES) {
    // Find all matches in the *current* working string
    const matches: Array<{ original: string; index: number }> = [];
    let m: RegExpExecArray | null;
    const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
    re.lastIndex = 0;
    while ((m = re.exec(working)) !== null) {
      if (m[0].trim() === "" && m[0] === "") continue; // skip zero-length
      matches.push({ original: m[0], index: m.index });
    }

    if (matches.length === 0) continue;

    // Build de-duplicated suggestions (same literal text → one suggestion)
    const seen = new Set<string>();
    for (const match of matches) {
      const key = match.original.toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);

      const tokenDelta = Math.round((replacement.length - match.original.length) / 4);
      suggestions.push({
        label: `Remove filler: "${match.original.trim()}"`,
        original: match.original,
        replacement,
        reason,
        tokenDelta,
      });
    }

    // Apply replacement to produce refined text for next pass
    working = working.replace(pattern, replacement);
  }

  // Collapse any double-spaces that result from stripping
  working = working.replace(/ {2,}/g, " ").trim();

  const tokenDelta = suggestions.reduce((s, sg) => s + sg.tokenDelta, 0);

  return {
    pass: "fillerStrip",
    name: "Filler word removal",
    applied: suggestions.length > 0,
    suggestions,
    tokenDelta,
  };
}

/** Apply the pass and return the cleaned prompt. */
export function applyFillerStrip(prompt: string): string {
  let working = prompt;
  for (const [pattern, replacement] of FILLER_RULES) {
    working = working.replace(pattern, replacement);
  }
  return working.replace(/ {2,}/g, " ").trim();
}
