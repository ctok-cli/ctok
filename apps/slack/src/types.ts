import type { TokenEstimate, RecommendationResult, ReductionSuggestion, CostEstimate } from "@ctok/core";
import type { RespondArguments, KnownBlock } from "@slack/bolt";

export interface CheckResult {
  estimate: TokenEstimate;
  recommendation: RecommendationResult;
  suggestions: ReductionSuggestion[];
  cost: CostEstimate;
}

export interface ScanFile {
  path: string;
  tokens: number;
}

export interface ScanResult {
  totalFiles: number;
  estimatedTokens: number;
  projectType: string;
  topHeavyFiles: ScanFile[];
}

export interface RefineOutput {
  refined: string;
  tokensSaved: number;
  savedPct: number;
}

export interface ParsedArgs {
  subcommand: string;
  text: string;
  model?: string;
  plan?: string;
  taskType?: string;
}

export type RespondFn = (opts: RespondArguments) => Promise<void>;
