import type { ChunkAnalysis, EstimatorInput, TokenEstimate } from "../types";
import { estimateOutput } from "./output";
import { estimateTokensFor, rangeForChunk } from "./tokenize";

const SYSTEM_OVERHEAD_TOKENS = 350;

export function estimate(input: EstimatorInput): TokenEstimate {
  const chunks: ChunkAnalysis[] = [];

  if (input.prompt.trim()) {
    chunks.push(estimateTokensFor(input.prompt, undefined, "prompt"));
  }
  if (input.pastedCode?.trim()) {
    chunks.push(estimateTokensFor(input.pastedCode, undefined, "pasted code"));
  }
  if (input.projectContext?.trim()) {
    chunks.push(estimateTokensFor(input.projectContext, undefined, "project context"));
  }
  for (const f of input.files) {
    const ext = f.name.includes(".") ? f.name.split(".").pop() : undefined;
    chunks.push(estimateTokensFor(f.content, ext, f.name));
  }

  const inputExpected =
    chunks.reduce((a, c) => a + c.tokens, 0) + SYSTEM_OVERHEAD_TOKENS;
  let inputMin = SYSTEM_OVERHEAD_TOKENS;
  let inputMax = SYSTEM_OVERHEAD_TOKENS;
  for (const c of chunks) {
    const r = rangeForChunk(c);
    inputMin += r.min;
    inputMax += r.max;
  }

  const output = estimateOutput(inputExpected, input.taskType);

  const kinds = new Set(chunks.map((c) => c.kind));
  let confidence: TokenEstimate["confidence"] = "high";
  if (kinds.has("minified") || inputExpected > 80_000) confidence = "low";
  else if (kinds.size >= 3 || inputExpected > 25_000) confidence = "medium";

  return {
    input: { min: inputMin, expected: inputExpected, max: inputMax },
    output,
    totalExpected: inputExpected + output.expected,
    confidence,
    chunks,
  };
}

export * from "./contentTypes";
export * from "./tokenize";
export * from "./output";
