import type { PassResult, PassSuggestion } from "../types";

/**
 * Vague verbs map to specific alternatives.
 * Each entry: [verbRegex, candidates[], reason]
 * Candidates are ordered: most-common domain meaning first.
 * The pass reports the top 2-3 so the user can choose.
 *
 * `autoApply` flips the rule from "suggest only" to "rewrite in place".
 * Default is false - we now leave the choice to the user for any verb
 * whose meaning depends on context (e.g. "check" could be "review",
 * "validate", "inspect", or "test" depending on what they're checking).
 * Only wordy phrases with a single sensible compaction get autoApply=true.
 */
const VAGUE_VERB_RULES: Array<{
  pattern: RegExp;
  candidates: string[];
  reason: string;
  autoApply?: boolean;
}> = [
  {
    pattern: /\bhandle\b/gi,
    candidates: ["validate", "process", "dispatch", "persist", "transform"],
    reason: "'handle' is ambiguous - name the exact operation",
  },
  {
    pattern: /\bdeal with\b/gi,
    candidates: ["validate", "process", "transform", "resolve"],
    reason: "'deal with' is ambiguous - name the exact operation",
  },
  {
    pattern: /\bwork on\b/gi,
    candidates: ["implement", "refactor", "debug", "extend"],
    reason: "'work on' is vague - state the action",
  },
  {
    pattern: /\bimprove\b/gi,
    candidates: ["optimize", "refactor", "clarify", "extend"],
    reason: "'improve' lacks a measurable axis - pick a specific goal",
  },
  {
    pattern: /\bfix it\b/gi,
    candidates: ["correct the validation logic", "resolve the off-by-one error"],
    reason: "'fix it' is too vague - name the symptom and expected behaviour",
  },
  {
    pattern: /\bmake it better\b/gi,
    candidates: ["improve performance", "improve readability", "reduce complexity"],
    reason: "'make it better' needs a measurable axis",
  },
  {
    pattern: /\bdo something\b/gi,
    candidates: ["implement", "add", "remove"],
    reason: "'do something' has no meaning - state the action",
  },
  {
    pattern: /\bprocess it\b/gi,
    candidates: ["parse", "validate", "transform", "persist"],
    reason: "'process it' is ambiguous - name the transformation",
  },
  {
    pattern: /\buse it\b/gi,
    candidates: ["call", "invoke", "pass", "render"],
    reason: "'use it' is ambiguous - name how it is used",
  },
  {
    pattern: /\bcheck\b/gi,
    candidates: ["review", "validate", "verify", "inspect", "test"],
    reason: "'check' is vague - name what property is being tested",
  },
  {
    pattern: /\bupdate\b/gi,
    candidates: ["set", "patch", "replace", "increment"],
    reason: "'update' is vague - name the mutation type",
  },
  {
    pattern: /\bchange\b/gi,
    candidates: ["rename", "replace", "refactor", "migrate"],
    reason: "'change' is vague - name the specific modification",
  },
  {
    pattern: /\badd support for\b/gi,
    candidates: ["implement", "integrate", "expose"],
    reason: "'add support for' is wordy - use a direct verb",
    autoApply: true, // always shorter, "implement" is a safe default
  },
  {
    pattern: /\bintegrate\b/gi,
    candidates: ["connect", "wire up", "embed", "import"],
    reason: "'integrate' is vague about the mechanism",
  },
];

export function vagueVerbReplace(prompt: string): PassResult {
  const suggestions: PassSuggestion[] = [];

  for (const { pattern, candidates, reason } of VAGUE_VERB_RULES) {
    const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    const seen = new Set<string>();

    while ((m = re.exec(prompt)) !== null) {
      const key = m[0].toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      // Build a compact replacement string showing top 3 candidates
      const top = candidates.slice(0, 3);
      const replacement = top.join(" | ");

      suggestions.push({
        label: `Replace vague verb: "${m[0]}" → ${top.slice(0, 2).join(" or ")}`,
        original: m[0],
        replacement,
        reason,
        tokenDelta: 0, // replacements are same length or longer - savings come from clarity, not char count
      });
    }
  }

  return {
    pass: "vagueVerbReplace",
    name: "Vague verb replacement",
    applied: suggestions.length > 0,
    suggestions,
    tokenDelta: 0,
  };
}

/**
 * Apply the pass. Only rewrites verbs flagged `autoApply: true` - everything
 * else is reported as a suggestion in the pass result so the user picks the
 * intended candidate. This avoids the "check this README" -> "validate this
 * README" mistake where the picker had to guess from a 4-way menu.
 */
export function applyVagueVerbReplace(prompt: string): string {
  let working = prompt;
  for (const { pattern, candidates, autoApply } of VAGUE_VERB_RULES) {
    if (autoApply) {
      working = working.replace(pattern, candidates[0]);
    }
  }
  return working;
}
