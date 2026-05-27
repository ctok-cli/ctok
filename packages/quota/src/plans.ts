/**
 * Claude plan limits table.
 *
 * Anthropic does not publish exact token quotas - they publish *message* limits
 * that reset on a rolling 5-hour window. Numbers below are best-effort estimates
 * derived from Anthropic's public documentation and community reports as of 2025.
 * All calculations in this package carry an "estimated" disclaimer.
 *
 * Sources:
 *  - https://support.anthropic.com/en/articles/8325612
 *  - https://www.anthropic.com/pricing (plan comparison table)
 */

export type PlanId =
  | "free"
  | "pro"
  | "max5x"
  | "max20x"
  | "team"
  | "enterprise"
  | "api";

export type ModelTier = "haiku" | "sonnet" | "opus";

/**
 * Message limits per 5-hour rolling window, per model tier.
 * `null` = no enforced message cap (API / Enterprise billed per token).
 */
export interface PlanWindowLimits {
  haiku: number | null;
  sonnet: number | null;
  opus: number | null;
}

export interface Plan {
  id: PlanId;
  label: string;
  /** Monthly price in USD; null = custom/enterprise */
  monthlyUsd: number | null;
  /** Message limits per 5-hour rolling window */
  window5h: PlanWindowLimits;
  /** Whether limits are hard (enforced) or estimated */
  limitsAreEstimated: boolean;
  /** Best-effort description of the limit model */
  limitNote: string;
}

/** Approximate average tokens per typical developer message (input + output). */
export const TYPICAL_TOKENS_PER_MESSAGE = 2_000;

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    label: "Claude.ai Free",
    monthlyUsd: 0,
    window5h: { haiku: 20, sonnet: 10, opus: 0 },
    limitsAreEstimated: true,
    limitNote: "Free tier has low limits; Opus not available.",
  },
  pro: {
    id: "pro",
    label: "Claude.ai Pro",
    monthlyUsd: 20,
    window5h: { haiku: 200, sonnet: 45, opus: 30 },
    limitsAreEstimated: true,
    limitNote:
      "Pro limits are rolling 5-hour windows. Limits vary with demand; these are typical off-peak estimates.",
  },
  max5x: {
    id: "max5x",
    label: "Claude.ai Max (5×)",
    monthlyUsd: 100,
    window5h: { haiku: 1_000, sonnet: 225, opus: 150 },
    limitsAreEstimated: true,
    limitNote: "Max 5× = approx 5× Pro limits.",
  },
  max20x: {
    id: "max20x",
    label: "Claude.ai Max (20×)",
    monthlyUsd: 200,
    window5h: { haiku: 4_000, sonnet: 900, opus: 600 },
    limitsAreEstimated: true,
    limitNote: "Max 20× = approx 20× Pro limits.",
  },
  team: {
    id: "team",
    label: "Claude.ai Team",
    monthlyUsd: 25,
    window5h: { haiku: 200, sonnet: 45, opus: 30 },
    limitsAreEstimated: true,
    limitNote: "Team plan uses similar message limits to Pro per seat.",
  },
  enterprise: {
    id: "enterprise",
    label: "Claude.ai Enterprise",
    monthlyUsd: null,
    window5h: { haiku: null, sonnet: null, opus: null },
    limitsAreEstimated: false,
    limitNote: "Enterprise quotas are negotiated - no fixed message cap.",
  },
  api: {
    id: "api",
    label: "Anthropic API",
    monthlyUsd: null,
    window5h: { haiku: null, sonnet: null, opus: null },
    limitsAreEstimated: false,
    limitNote:
      "API is metered per token. Rate limits (requests/min) apply but there is no message quota window.",
  },
};

/** Resolve a model ID string to a ModelTier. */
export function modelToTier(modelId: string): ModelTier {
  const id = modelId.toLowerCase();
  if (id.includes("haiku")) return "haiku";
  if (id.includes("opus")) return "opus";
  return "sonnet"; // default for sonnet, claude-3-5, etc.
}

/** Get window message limit for a plan + model. Returns null if unlimited. */
export function getWindowLimit(planId: PlanId, modelId: string): number | null {
  const plan = PLANS[planId];
  if (!plan) return null;
  const tier = modelToTier(modelId);
  return plan.window5h[tier];
}
