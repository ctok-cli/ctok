import type { TokenEstimate, RecommendationResult, ReductionSuggestion, CostEstimate } from "@ctok/core";

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
