import { analyze } from "@ctok/core";
import { refine } from "@ctok/refiner";
import { getQuotaImpact } from "@ctok/quota";
import type { AnalysisResult, TaskType, ModelId } from "@ctok/core";
import type { RefineResult } from "@ctok/refiner";
import type { ProjectScan } from "@ctok/scanner";

export type { ProjectScan };

export interface CtokAnalysis {
  result: AnalysisResult;
  refineResult?: RefineResult;
  quotaPct?: number;
  remainingMessages?: number;
  scanResult?: ProjectScan;
}

export function runAnalysis(
  text: string,
  opts: { model?: string; taskType?: TaskType; plan?: string; withRefine?: boolean },
): CtokAnalysis {
  const taskType: TaskType = opts.taskType ?? "general";
  const result = analyze(
    { prompt: text, files: [], taskType },
    (opts.model || undefined) as ModelId | undefined,
  );

  const quota = getQuotaImpact({
    estimatedTokens: result.estimate.input.expected + result.estimate.output.expected,
    model: result.cost.model,
    plan: (opts.plan ?? "pro") as any,
  });

  const refineResult = opts.withRefine ? refine({ prompt: text }) : undefined;

  return {
    result,
    refineResult,
    quotaPct: quota.percentOf5hWindow ?? undefined,
    remainingMessages: quota.remainingMessagesIn5h ?? undefined,
  };
}

export function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function fmtUsd(n: number): string {
  if (n < 0.001) return "< $0.001";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(3)}`;
}

export function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}
