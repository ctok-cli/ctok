import type {
  EstimatorInput,
  RecommendationResult,
  TokenEstimate,
} from "../types";
import { scoreComplexity } from "./complexity";
import { recommendEffort } from "./effort";
import { recommendModel } from "./model";

export function recommend(
  input: EstimatorInput,
  estimate: TokenEstimate,
): RecommendationResult {
  const complexity = scoreComplexity(input, estimate);
  const model = recommendModel(complexity, input.taskType, estimate.input.expected);
  const effort = recommendEffort(complexity, input.taskType);
  return { complexity, model, effort };
}

export * from "./complexity";
export * from "./model";
export * from "./effort";
