import {
  PLANS,
  TYPICAL_TOKENS_PER_MESSAGE,
  modelToTier,
  type PlanId,
} from "./plans";

export interface QuotaImpactOptions {
  /** Estimated input tokens for this prompt */
  estimatedTokens: number;
  /** Model that will be used, e.g. "claude-sonnet-4-6" */
  model: string;
  /** Claude plan identifier */
  plan: PlanId;
}

export interface QuotaImpact {
  plan: PlanId;
  modelTier: string;
  /** Number of message-equivalents this prompt represents */
  equivalentMessages: number;
  /** Estimated % of the 5-hour window budget this prompt uses */
  percentOf5hWindow: number | null;
  /** Estimated % of a 24-hour rolling budget (4.8 × 5h window) */
  percentOfDailyBudget: number | null;
  /** Estimated number of similar prompts remaining in the current 5h window */
  remainingMessagesIn5h: number | null;
  /** True when limits are unknown/unlimited (Enterprise, API) */
  unlimited: boolean;
  /** Human-readable one-line summary */
  summary: string;
  /** Always true — callers must display this to the user */
  isEstimated: true;
}

/** Number of 5-hour windows per 24 hours (rolling). */
const WINDOWS_PER_DAY = 24 / 5; // = 4.8

export function getQuotaImpact(options: QuotaImpactOptions): QuotaImpact {
  const { estimatedTokens, model, plan: planId } = options;
  const plan = PLANS[planId];

  if (!plan) {
    throw new Error(`Unknown plan: "${planId}". Valid plans: ${Object.keys(PLANS).join(", ")}`);
  }

  const modelTier = modelToTier(model);
  const windowLimit = plan.window5h[modelTier];

  // Convert tokens to equivalent message count
  const equivalentMessages = Math.max(
    1,
    Math.round(estimatedTokens / TYPICAL_TOKENS_PER_MESSAGE),
  );

  if (windowLimit === null) {
    // Enterprise / API — no message cap
    return {
      plan: planId,
      modelTier,
      equivalentMessages,
      percentOf5hWindow: null,
      percentOfDailyBudget: null,
      remainingMessagesIn5h: null,
      unlimited: true,
      summary: `${plan.label}: ${plan.limitNote}`,
      isEstimated: true,
    };
  }

  const percentOf5hWindow = parseFloat(
    ((equivalentMessages / windowLimit) * 100).toFixed(1),
  );
  const percentOfDailyBudget = parseFloat(
    ((equivalentMessages / (windowLimit * WINDOWS_PER_DAY)) * 100).toFixed(1),
  );
  const remainingMessagesIn5h = Math.max(0, windowLimit - equivalentMessages);

  // Build a human-readable summary
  let summary: string;
  if (percentOf5hWindow >= 100) {
    summary =
      `⚠️  This prompt (~${equivalentMessages} msg equiv.) exceeds your estimated ${plan.label} ` +
      `5-hour window (${windowLimit} msgs for ${modelTier}). ` +
      `Consider splitting, using a smaller model, or upgrading your plan.`;
  } else if (percentOf5hWindow >= 50) {
    summary =
      `This prompt uses ~${percentOf5hWindow}% of your estimated ${plan.label} 5-hour window ` +
      `(${equivalentMessages}/${windowLimit} msg equiv. for ${modelTier}).`;
  } else {
    summary =
      `This prompt uses ~${percentOf5hWindow}% of your estimated ${plan.label} 5-hour window. ` +
      `~${remainingMessagesIn5h} similar prompts remaining in this window.`;
  }

  return {
    plan: planId,
    modelTier,
    equivalentMessages,
    percentOf5hWindow,
    percentOfDailyBudget,
    remainingMessagesIn5h,
    unlimited: false,
    summary,
    isEstimated: true,
  };
}

/**
 * Convenience: get impact for multiple plan tiers so the CLI can show a comparison table.
 */
export function compareAcrossPlans(
  estimatedTokens: number,
  model: string,
): Record<PlanId, QuotaImpact> {
  const result = {} as Record<PlanId, QuotaImpact>;
  for (const planId of Object.keys(PLANS) as PlanId[]) {
    result[planId] = getQuotaImpact({ estimatedTokens, model, plan: planId });
  }
  return result;
}
