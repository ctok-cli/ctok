import { refine } from "@ctok/refiner";

export const refineTool = {
  name: "refine",
  description:
    "Run the 7-pass prompt refiner on a prompt. Strips filler words, replaces vague verbs, " +
    "deduplicates repeated blocks, compresses large code references, adds output-format hints, " +
    "collapses scattered negatives, and scores specificity 0-100. " +
    "Returns the refined prompt, token savings, specificity score before/after, and per-pass details.",
  inputSchema: {
    type: "object" as const,
    properties: {
      prompt: {
        type: "string",
        description: "The prompt to refine",
      },
      context: {
        type: "string",
        description: "Optional surrounding context (not refined, but used for analysis)",
      },
    },
    required: ["prompt"],
  },
};

export function runRefine(args: Record<string, unknown>) {
  const prompt = String(args.prompt ?? "");
  const context = args.context ? String(args.context) : undefined;

  const result = refine({ prompt, context });

  return {
    original: result.original,
    refined: result.refined,
    savedTokens: result.savedTokens,
    savedPct: result.savedPct,
    specificityScore: result.specificityScore,
    warnings: result.warnings,
    passes: result.passes.map((p) => ({
      pass: p.pass,
      name: p.name,
      applied: p.applied,
      tokenDelta: p.tokenDelta,
      suggestions: p.suggestions.map((s) => ({
        label: s.label,
        original: s.original,
        replacement: s.replacement,
        reason: s.reason,
        tokenDelta: s.tokenDelta,
      })),
    })),
  };
}
