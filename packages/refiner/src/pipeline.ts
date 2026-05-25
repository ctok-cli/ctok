import type { RefineInput, RefineResult, PassResult } from "./types";
import { fillerStrip, applyFillerStrip } from "./passes/fillerStrip";
import { vagueVerbReplace, applyVagueVerbReplace } from "./passes/vagueVerbReplace";
import { structureScaffold, applyStructureScaffold } from "./passes/structureScaffold";
import { dedup, applyDedup } from "./passes/dedup";
import { fileRefCompression, applyFileRefCompression } from "./passes/fileRefCompression";
import { outputFormatHint, applyOutputFormatHint } from "./passes/outputFormatHint";
import { negativeCollapse, applyNegativeCollapse } from "./passes/negativeCollapse";
import { specificityScore } from "./specificityScore";

const CHARS_PER_TOKEN = 4;

function estimateTokens(text: string): number {
  return Math.round(text.length / CHARS_PER_TOKEN);
}

export function refine(input: RefineInput): RefineResult {
  const { prompt } = input;
  const warnings: string[] = [];

  if (!prompt || prompt.trim().length === 0) {
    return {
      original: prompt,
      refined: prompt,
      passes: [],
      savedTokens: 0,
      savedPct: 0,
      specificityScore: 0,
      warnings: ["Empty prompt — nothing to refine."],
    };
  }

  // analysis passes — run against original
  const passResults: PassResult[] = [
    fillerStrip(prompt),
    vagueVerbReplace(prompt),
    structureScaffold(prompt),
    dedup(prompt),
    fileRefCompression(prompt),
    outputFormatHint(prompt),
    negativeCollapse(prompt),
  ];

  // apply passes sequentially
  let refined = prompt;
  refined = applyFillerStrip(refined);
  refined = applyVagueVerbReplace(refined);
  refined = applyStructureScaffold(refined);
  refined = applyDedup(refined);
  refined = applyFileRefCompression(refined);
  refined = applyOutputFormatHint(refined);
  refined = applyNegativeCollapse(refined);
  refined = refined.trim();

  const originalTokens = estimateTokens(prompt);
  const refinedTokens = estimateTokens(refined);
  const savedTokens = Math.max(0, originalTokens - refinedTokens);
  const savedPct = originalTokens > 0 ? Math.round((savedTokens / originalTokens) * 100) : 0;

  if (originalTokens < 20) {
    warnings.push("Prompt is very short — refinement suggestions may not apply.");
  }

  return {
    original: prompt,
    refined,
    passes: passResults,
    savedTokens,
    savedPct,
    specificityScore: specificityScore(refined),
    warnings,
  };
}
