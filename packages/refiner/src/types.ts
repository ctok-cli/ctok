export interface RefineInput {
  prompt: string;
  /** Optional context: what language/framework this prompt targets */
  context?: string;
}

export interface PassSuggestion {
  /** Short label shown in CLI/UI */
  label: string;
  /** Original text span being replaced */
  original: string;
  /** Suggested replacement - may be empty string (delete) */
  replacement: string;
  /** Why this replacement saves tokens or improves clarity */
  reason: string;
  /** Approximate token delta (negative = savings) */
  tokenDelta: number;
}

export interface PassResult {
  /** Unique pass identifier, e.g. "fillerStrip" */
  pass: string;
  /** Human-readable pass name */
  name: string;
  applied: boolean;
  suggestions: PassSuggestion[];
  /** Estimated total token delta from all suggestions in this pass */
  tokenDelta: number;
}

export interface RefineResult {
  original: string;
  /** Prompt with all suggestions auto-applied */
  refined: string;
  passes: PassResult[];
  /** Total tokens saved (original - refined) - approximate */
  savedTokens: number;
  /** Percentage reduction */
  savedPct: number;
  /** 0-100 specificity score (pass 8, Step 5 - placeholder 0 in Step 4) */
  specificityScore: number;
  warnings: string[];
}
