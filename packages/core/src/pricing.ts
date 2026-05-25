import type { ModelId } from "./types";

// Per-1M-token list prices, USD. Approximate — adjust as Anthropic updates them.
// The tool flags these as estimates. Update in one place when pricing changes.
export const PRICING: Record<
  ModelId,
  { input: number; output: number; label: string; tier: string }
> = {
  "haiku-4-5": {
    input: 1.0,
    output: 5.0,
    label: "Claude Haiku 4.5",
    tier: "fast",
  },
  "sonnet-4-6": {
    input: 3.0,
    output: 15.0,
    label: "Claude Sonnet 4.6",
    tier: "balanced",
  },
  "opus-4-7": {
    input: 15.0,
    output: 75.0,
    label: "Claude Opus 4.7",
    tier: "frontier",
  },
};

export function priceFor(
  model: ModelId,
  inputTokens: number,
  outputTokens: number,
) {
  const p = PRICING[model];
  const inputUsd = (inputTokens / 1_000_000) * p.input;
  const outputUsd = (outputTokens / 1_000_000) * p.output;
  return {
    inputUsd,
    outputUsd,
    totalUsd: inputUsd + outputUsd,
  };
}
