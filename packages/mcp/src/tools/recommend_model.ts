import { analyze } from "@ctok/core";
import type { EstimatorInput, TaskType } from "@ctok/core";

const TASK_TYPES: TaskType[] = [
  "bug-fix","feature","refactor","debugging","review","documentation","architecture","general",
];

export const recommendModelTool = {
  name: "recommend_model",
  description:
    "Recommend the best Claude model and effort level for a given task. " +
    "Returns the recommended model (haiku-4-5 / sonnet-4-6 / opus-4-7), effort level " +
    "(low / medium / high / xhigh), and the reasoning behind each choice.",
  inputSchema: {
    type: "object" as const,
    properties: {
      prompt: {
        type: "string",
        description: "The prompt or task description",
      },
      taskType: {
        type: "string",
        enum: TASK_TYPES,
        description: "Type of task. Defaults to 'general'.",
      },
    },
    required: ["prompt"],
  },
};

export function runRecommendModel(args: Record<string, unknown>) {
  const prompt = String(args.prompt ?? "");
  const taskType = (
    TASK_TYPES.includes(args.taskType as TaskType) ? args.taskType : "general"
  ) as TaskType;

  const input: EstimatorInput = { prompt, files: [], taskType };
  const result = analyze(input);
  const { model, effort, complexity } = result.recommendation;

  return {
    model: model.model,
    modelReason: model.reason,
    alternatives: model.alternatives.map((a) => ({
      model: a.model,
      reason: a.reason,
    })),
    effort: effort.effort,
    effortReason: effort.reason,
    complexity: {
      band: complexity.band,
      score: complexity.score,
      signals: complexity.signals,
    },
  };
}
