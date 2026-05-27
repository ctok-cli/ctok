export type LlmModel =
  | "claude-haiku-4-5"
  | "claude-sonnet-4-6"
  | "claude-opus-4-7";

export interface LlmRefineOptions {
  /** Anthropic API key. Falls back to ANTHROPIC_API_KEY env var. */
  apiKey?: string;
  /** Model to use. Defaults to haiku-4-5 (cheapest, fast). */
  model?: LlmModel;
  /** Maximum tokens for the refined output. Defaults to 4096. */
  maxTokens?: number;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
}

export interface LlmRefineResult {
  /** The LLM-refined prompt text. */
  refined: string;
  /** Approximate tokens in the original prompt (character-based estimate). */
  originalTokens: number;
  /** Approximate tokens in the refined prompt. */
  refinedTokens: number;
  /** Token savings (may be 0 if LLM didn't trim). */
  savedTokens: number;
  /** Percentage reduction (0-100). */
  savedPct: number;
  /** Model used. */
  model: LlmModel;
  /** Total input tokens used for the refine call itself (for billing awareness). */
  refineCallInputTokens?: number;
  /** Total output tokens used for the refine call itself. */
  refineCallOutputTokens?: number;
}
