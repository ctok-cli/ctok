import {
  analyze,
  type AnalysisResult,
  type ModelId,
  type TaskType,
} from "@ctok/core";
import { getQuotaImpact, type QuotaImpact, type PlanId } from "@ctok/quota";
import { refine, type RefineResult } from "@ctok/refiner";

export interface CtokAnalysis {
  result: AnalysisResult;
  quota: QuotaImpact | null;
  contextPct: number;
}

export interface AnalysisOptions {
  model?: string;
  taskType?: string;
  plan?: string;
}

export function runAnalysis(text: string, opts: AnalysisOptions = {}): CtokAnalysis {
  const taskType = (opts.taskType as TaskType | undefined) ?? "general";
  const modelId = (opts.model || undefined) as ModelId | undefined;

  const result = analyze(
    { prompt: text, files: [], taskType },
    modelId,
  );

  let quota: QuotaImpact | null = null;
  if (opts.plan && opts.plan !== "api") {
    try {
      quota = getQuotaImpact({
        estimatedTokens: result.estimate.input.expected,
        model: result.recommendation.model.model,
        plan: opts.plan as PlanId,
      });
    } catch {
      // ignore unknown plan
    }
  }

  const contextPct = result.estimate.input.expected / 200_000;

  return { result, quota, contextPct };
}

export interface RefineOutput {
  refined: string;
  tokensSaved: number;
  refineResult: RefineResult;
}

export function runRefine(text: string): RefineOutput {
  const refineResult = refine({ prompt: text });
  return {
    refined: refineResult.refined,
    tokensSaved: refineResult.savedTokens,
    refineResult,
  };
}
