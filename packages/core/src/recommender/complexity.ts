import type {
  ComplexityBreakdown,
  EstimatorInput,
  TaskType,
  TokenEstimate,
} from "../types";

const TASK_BASE: Record<TaskType, number> = {
  "bug-fix":     18,
  feature:       30,
  refactor:      45,
  debugging:     28,
  review:        22,
  documentation: 12,
  architecture:  60,
  general:       20,
};

const KEYWORD_WEIGHTS: { keyword: RegExp; weight: number; label: string }[] = [
  { keyword: /\barchitect(ure|ural)?\b/i,                              weight: 12, label: "architecture keyword" },
  { keyword: /\brefactor(ing)?\b/i,                                    weight: 8,  label: "refactor keyword" },
  { keyword: /\bmigration\b/i,                                         weight: 10, label: "migration keyword" },
  { keyword: /\b(distributed|concurren|race condition|deadlock)\b/i,   weight: 12, label: "concurrency / distributed signal" },
  { keyword: /\b(security|auth|crypto|owasp|vulnerab)\b/i,             weight: 10, label: "security signal" },
  { keyword: /\bperformance\b/i,                                       weight: 6,  label: "performance signal" },
  { keyword: /\b(design|propose|evaluate|trade.?off)\b/i,              weight: 7,  label: "design / trade-off signal" },
  { keyword: /\b(simple|trivial|small|quick|tiny)\b/i,                 weight: -6, label: "simplicity signal" },
  { keyword: /\b(typo|rename|comment)\b/i,                             weight: -8, label: "cosmetic-change signal" },
];

export function scoreComplexity(
  input: EstimatorInput,
  estimate: TokenEstimate,
): ComplexityBreakdown {
  const signals: { label: string; weight: number }[] = [];
  let score = 0;

  const base = TASK_BASE[input.taskType];
  score += base;
  signals.push({ label: `task type: ${input.taskType}`, weight: base });

  const inputTokens = estimate.input.expected;
  // Exclude fixed system overhead from volume scoring — overhead is constant
  // and must not artificially inflate tiny prompts into higher complexity bands.
  const SYSTEM_OVERHEAD = 350;
  const contentTokens = Math.max(0, inputTokens - SYSTEM_OVERHEAD);
  const volumeWeight = Math.min(
    35,
    Math.round(Math.log10(Math.max(100, contentTokens)) * 9),
  );
  score += volumeWeight;
  signals.push({
    label: `input volume (~${formatTokens(inputTokens)} tokens)`,
    weight: volumeWeight,
  });

  if (input.files.length > 0) {
    const breadthWeight = Math.min(20, input.files.length * 3);
    score += breadthWeight;
    signals.push({ label: `${input.files.length} context file(s)`, weight: breadthWeight });
  }

  const kinds = new Set(estimate.chunks.map((c) => c.kind));
  if (kinds.size >= 3) {
    score += 6;
    signals.push({ label: `mixed content (${kinds.size} kinds)`, weight: 6 });
  }

  const haystack = [input.prompt, input.pastedCode ?? "", input.projectContext ?? ""].join("\n");
  for (const k of KEYWORD_WEIGHTS) {
    if (k.keyword.test(haystack)) {
      score += k.weight;
      signals.push({ label: k.label, weight: k.weight });
    }
  }

  if (estimate.output.expected > 4000) {
    score += 8;
    signals.push({ label: "large expected output", weight: 8 });
  }

  score = Math.max(0, Math.min(100, score));
  // Thresholds: simple < 35, normal 35–64, deep ≥ 65
  const band: ComplexityBreakdown["band"] =
    score < 35 ? "simple" : score < 65 ? "normal" : "deep";

  return { score, signals, band };
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`;
  return `${n}`;
}
