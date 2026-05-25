import type { PassResult, PassSuggestion } from "../types";

/** Signals that the prompt is asking for a specific kind of output. */
const OUTPUT_REQUEST_PATTERNS: Array<{
  pattern: RegExp;
  kind: "code" | "diff" | "json" | "list" | "explanation" | "sql" | "shell";
  hints: string[];
}> = [
  {
    pattern: /\b(?:write|implement|add|create|build|generate)\b.*\b(?:function|method|class|component|hook|endpoint|route|handler|middleware|module|service|util)\b/i,
    kind: "code",
    hints: [
      'Return only the changed function/method — no surrounding code.',
      'Return only the new file content — no explanation.',
      'Return only the diff (unified diff format).',
    ],
  },
  {
    pattern: /\b(?:refactor|rename|move|extract|inline|convert)\b/i,
    kind: "diff",
    hints: [
      'Return only the diff (unified diff format) — no explanation.',
      'Return only the changed lines — no unchanged context.',
    ],
  },
  {
    pattern: /\b(?:fix|debug|resolve|patch|correct)\b.*\b(?:bug|error|issue|crash|problem|exception|warning)\b/i,
    kind: "diff",
    hints: [
      'Return only the corrected lines with a one-sentence explanation of the root cause.',
      'Return only the diff (unified diff format).',
    ],
  },
  {
    pattern: /\b(?:list|enumerate|show|give me|tell me|what are)\b.*\b(?:all|every|the)\b/i,
    kind: "list",
    hints: [
      'Return a numbered list — no prose.',
      'Return a bullet list — no introduction or conclusion.',
    ],
  },
  {
    pattern: /\b(?:return|output|respond|format)\b.*\bjson\b/i,
    kind: "json",
    hints: [
      'Return only valid JSON — no markdown fences, no explanation.',
    ],
  },
  {
    pattern: /\b(?:write|generate|create|produce)\b.*\b(?:sql|query|select|insert|update|delete|migration)\b/i,
    kind: "sql",
    hints: [
      'Return only the SQL — no explanation.',
      'Return only the migration file content.',
    ],
  },
  {
    pattern: /\b(?:write|create|generate)\b.*\b(?:script|bash|shell|command|dockerfile|makefile|workflow|yaml|ci)\b/i,
    kind: "shell",
    hints: [
      'Return only the script/file content — no explanation.',
      'Return only the changed lines.',
    ],
  },
  {
    pattern: /\b(?:explain|describe|summarize|what is|how does|why does|tell me about)\b/i,
    kind: "explanation",
    hints: [
      'Respond in ≤3 bullet points.',
      'Respond in one paragraph — no headers.',
    ],
  },
];

/** Check whether the prompt already has an explicit output format instruction. */
const ALREADY_HAS_FORMAT_RE = /\b(?:return only|respond (?:as|with|in)|output (?:only|as|in)|format[: ]|no (?:explanation|prose|markdown)|json only|diff only|numbered list|bullet(?:ed)? list)\b/i;

/** Section-header style already specifies output (e.g. "OUTPUT:" section). */
const STRUCTURED_OUTPUT_RE = /^OUTPUT\s*:/im;

export function outputFormatHint(prompt: string): PassResult {
  if (ALREADY_HAS_FORMAT_RE.test(prompt) || STRUCTURED_OUTPUT_RE.test(prompt)) {
    return {
      pass: "outputFormatHint",
      name: "Output format hint",
      applied: false,
      suggestions: [],
      tokenDelta: 0,
    };
  }

  for (const { pattern, hints } of OUTPUT_REQUEST_PATTERNS) {
    if (!pattern.test(prompt)) continue;

    // Build a single suggestion showing the top 2 options
    const top = hints.slice(0, 2);
    const replacement = top[0];

    const suggestion: PassSuggestion = {
      label: `Add output format constraint`,
      original: "",
      replacement: `\n\n${top.map((h) => `• ${h}`).join("\n")}`,
      reason:
        "No output format is specified. Adding one (e.g. 'Return only the diff') typically cuts output tokens by 30-60% and reduces hallucination.",
      tokenDelta: -30, // conservative estimate of output savings
    };

    return {
      pass: "outputFormatHint",
      name: "Output format hint",
      applied: true,
      suggestions: [suggestion],
      tokenDelta: -30,
    };
  }

  return {
    pass: "outputFormatHint",
    name: "Output format hint",
    applied: false,
    suggestions: [],
    tokenDelta: 0,
  };
}

export function applyOutputFormatHint(prompt: string): string {
  const result = outputFormatHint(prompt);
  if (!result.applied || result.suggestions.length === 0) return prompt;
  return prompt + result.suggestions[0].replacement;
}
