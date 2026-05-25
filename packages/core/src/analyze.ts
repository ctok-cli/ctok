import type { AnalysisResult, EstimatorInput, ModelId } from "./types";
import { estimate } from "./estimator";
import { recommend } from "./recommender";
import { buildSuggestions } from "./reducer";
import { priceFor } from "./pricing";

/**
 * Single entry-point for all shells (CLI, desktop, MCP, browser-ext).
 * Runs estimator → recommender → reducer → cost in one pure function call.
 */
export function analyze(
  input: EstimatorInput,
  modelOverride?: ModelId,
): AnalysisResult {
  const tokenEstimate = estimate(input);
  const recommendation = recommend(input, tokenEstimate);
  const suggestions = buildSuggestions(input, tokenEstimate);

  const model = modelOverride ?? recommendation.model.model;
  const expectedPrice = priceFor(model, tokenEstimate.input.expected, tokenEstimate.output.expected);
  const minPrice = priceFor(model, tokenEstimate.input.min, tokenEstimate.output.min);
  const maxPrice = priceFor(model, tokenEstimate.input.max, tokenEstimate.output.max);

  const cost = {
    model,
    inputUsd: expectedPrice.inputUsd,
    outputUsd: expectedPrice.outputUsd,
    totalUsd: expectedPrice.totalUsd,
    totalUsdRange: { min: minPrice.totalUsd, max: maxPrice.totalUsd },
  };

  return { estimate: tokenEstimate, recommendation, suggestions, cost };
}
