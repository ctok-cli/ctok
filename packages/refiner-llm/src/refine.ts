import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { SYSTEM_PROMPT, buildUserMessage } from "./prompt";
import { approxTokens } from "./tokenCount";
import type { LlmRefineOptions, LlmRefineResult, LlmModel } from "./types";

const DEFAULT_MODEL: LlmModel = "claude-haiku-4-5";
const DEFAULT_MAX_TOKENS = 4096;

// Map ctok model IDs → Anthropic model IDs
const MODEL_MAP: Record<LlmModel, string> = {
  "claude-haiku-4-5": "claude-haiku-4-5-20251001",
  "claude-sonnet-4-6": "claude-sonnet-4-6",
  "claude-opus-4-7": "claude-opus-4-7",
};

export async function refineLlm(
  prompt: string,
  opts: LlmRefineOptions = {},
): Promise<LlmRefineResult> {
  const apiKey = opts.apiKey ?? process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    throw new Error(
      "Anthropic API key required for --llm mode.\n" +
      "Set ANTHROPIC_API_KEY environment variable or run: ctok config set anthropic-key <key>",
    );
  }

  const model = opts.model ?? DEFAULT_MODEL;
  const anthropicModelId = MODEL_MAP[model];

  const anthropic = createAnthropic({ apiKey });

  const { text, usage } = await generateText({
    model: anthropic(anthropicModelId),
    system: SYSTEM_PROMPT,
    prompt: buildUserMessage(prompt),
    maxTokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
    abortSignal: opts.signal,
  });

  const refined = text.trim();
  const originalTokens = approxTokens(prompt);
  const refinedTokens = approxTokens(refined);
  const savedTokens = Math.max(0, originalTokens - refinedTokens);
  const savedPct = originalTokens > 0
    ? Math.round((savedTokens / originalTokens) * 100)
    : 0;

  return {
    refined,
    originalTokens,
    refinedTokens,
    savedTokens,
    savedPct,
    model,
    refineCallInputTokens: usage?.promptTokens,
    refineCallOutputTokens: usage?.completionTokens,
  };
}
