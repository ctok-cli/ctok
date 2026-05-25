import { analyze } from "@ctok/core";
import type { EstimatorInput, TaskType } from "@ctok/core";

const TASK_TYPES: TaskType[] = [
  "bug-fix","feature","refactor","debugging","review","documentation","architecture","general",
];

export const estimateTool = {
  name: "estimate",
  description:
    "Estimate token usage, cost, model recommendation, and reduction suggestions for a Claude prompt. " +
    "Returns input/output token ranges, estimated USD cost, the recommended model and effort level, " +
    "and any suggestions for reducing context size.",
  inputSchema: {
    type: "object" as const,
    properties: {
      prompt: {
        type: "string",
        description: "The prompt text you plan to send to Claude",
      },
      taskType: {
        type: "string",
        enum: TASK_TYPES,
        description: "Type of task — affects output-length estimate and model recommendation. Defaults to 'general'.",
      },
      pastedCode: {
        type: "string",
        description: "Optional code snippet included in the context window",
      },
      projectContext: {
        type: "string",
        description: "Optional project background / CLAUDE.md-style context that counts toward input tokens",
      },
    },
    required: ["prompt"],
  },
};

export function runEstimate(args: Record<string, unknown>) {
  const prompt = String(args.prompt ?? "");
  const taskType = (
    TASK_TYPES.includes(args.taskType as TaskType) ? args.taskType : "general"
  ) as TaskType;
  const pastedCode = args.pastedCode ? String(args.pastedCode) : undefined;
  const projectContext = args.projectContext ? String(args.projectContext) : undefined;

  const input: EstimatorInput = {
    prompt,
    files: [],
    taskType,
    pastedCode,
    projectContext,
  };

  const result = analyze(input);

  return {
    tokens: {
      input: result.estimate.input,
      output: result.estimate.output,
      totalExpected: result.estimate.totalExpected,
      confidence: result.estimate.confidence,
    },
    cost: {
      model: result.cost.model,
      inputUsd: result.cost.inputUsd,
      outputUsd: result.cost.outputUsd,
      totalUsd: result.cost.totalUsd,
      totalUsdRange: result.cost.totalUsdRange,
    },
    recommendation: {
      model: result.recommendation.model.model,
      modelReason: result.recommendation.model.reason,
      effort: result.recommendation.effort.effort,
      effortReason: result.recommendation.effort.reason,
      complexity: result.recommendation.complexity.band,
    },
    suggestions: result.suggestions.map((s) => ({
      title: s.title,
      detail: s.detail,
      estimatedSavingTokens: s.estimatedSavingTokens,
      severity: s.severity,
      action: s.action,
    })),
  };
}
