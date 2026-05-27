import type { PassResult, PassSuggestion } from "../types";

const STRUCTURED_MARKER = /^(GOAL|CONTEXT|CONSTRAINTS|OUTPUT|TASK|BACKGROUND|STEPS?|REQUIREMENTS?|FORMAT)\s*:/im;
const MARKDOWN_HEADING = /^#{1,4}\s+\w/m;

/**
 * Split prompt into logical sentences. Simple split on . ? ! followed by whitespace.
 * Preserves code blocks as single tokens.
 */
function countSentences(text: string): number {
  // Strip code blocks first
  const stripped = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`]+`/g, "");
  const matches = stripped.match(/[^.?!]+[.?!]+/g);
  return matches ? matches.length : 1;
}

function isAlreadyStructured(prompt: string): boolean {
  return STRUCTURED_MARKER.test(prompt) || MARKDOWN_HEADING.test(prompt);
}

function buildScaffold(prompt: string): string {
  // Try to extract the goal: first sentence or imperative clause
  const stripped = prompt.replace(/```[\s\S]*?```/g, "[code block]");
  const firstSentenceMatch = stripped.match(/^([^.?!\n]+[.?!]?)/);
  const goalHint = firstSentenceMatch ? firstSentenceMatch[1].trim() : stripped.slice(0, 80);

  return [
    `GOAL: ${goalHint}`,
    `CONTEXT: <what the AI needs to know - paste relevant code, error messages, or background here>`,
    `CONSTRAINTS:`,
    `- <language / framework / version>`,
    `- <what NOT to change>`,
    `- <performance / style requirements>`,
    `OUTPUT: <format - e.g. "Return only the changed function", "Respond as JSON: {…}", "Numbered list">`,
  ].join("\n");
}

export function structureScaffold(prompt: string): PassResult {
  const suggestions: PassSuggestion[] = [];

  if (isAlreadyStructured(prompt)) {
    return {
      pass: "structureScaffold",
      name: "Structure scaffold",
      applied: false,
      suggestions: [],
      tokenDelta: 0,
    };
  }

  const sentenceCount = countSentences(prompt);
  if (sentenceCount < 3) {
    // Short prompts don't benefit from structure
    return {
      pass: "structureScaffold",
      name: "Structure scaffold",
      applied: false,
      suggestions: [],
      tokenDelta: 0,
    };
  }

  const scaffold = buildScaffold(prompt);
  // Token delta: scaffold is typically shorter than a rambling prompt
  const tokenDelta = Math.round((scaffold.length - prompt.length) / 4);

  const suggestion: PassSuggestion = {
    label: "Restructure into GOAL / CONTEXT / CONSTRAINTS / OUTPUT",
    original: prompt,
    replacement: scaffold,
    reason:
      "Structured prompts reduce ambiguity, prevent redundant context, and help the model stay on task. " +
      "Fill in the sections and delete placeholders you don't need.",
    tokenDelta,
  };

  suggestions.push(suggestion);

  return {
    pass: "structureScaffold",
    name: "Structure scaffold",
    applied: true,
    suggestions,
    tokenDelta,
  };
}

export function applyStructureScaffold(prompt: string): string {
  const result = structureScaffold(prompt);
  if (result.applied && result.suggestions.length > 0) {
    return result.suggestions[0].replacement;
  }
  return prompt;
}
