/**
 * Browser-safe quota logic ported from @ctok/quota.
 * No Node.js APIs — pure data and math only.
 */

export type PlanId = "free" | "pro" | "max5x" | "max20x" | "team" | "enterprise" | "api";
export type ModelTier = "haiku" | "sonnet" | "opus";

export interface Plan {
  id: PlanId;
  label: string;
  monthlyUsd: number | null;
  window5h: { haiku: number | null; sonnet: number | null; opus: number | null };
}

export interface QuotaImpact {
  plan: PlanId;
  modelTier: ModelTier;
  equivalentMessages: number;
  percentOf5hWindow: number | null;
  remainingMessagesIn5h: number | null;
  unlimited: boolean;
}

const TYPICAL_TOKENS_PER_MESSAGE = 2_000;

export const PLANS: Record<PlanId, Plan> = {
  free:       { id: "free",       label: "Free",          monthlyUsd: 0,    window5h: { haiku: 20,    sonnet: 10,  opus: 0   } },
  pro:        { id: "pro",        label: "Pro ($20)",      monthlyUsd: 20,   window5h: { haiku: 200,   sonnet: 45,  opus: 30  } },
  max5x:      { id: "max5x",      label: "Max 5× ($100)",  monthlyUsd: 100,  window5h: { haiku: 1_000, sonnet: 225, opus: 150 } },
  max20x:     { id: "max20x",     label: "Max 20× ($200)", monthlyUsd: 200,  window5h: { haiku: 4_000, sonnet: 900, opus: 600 } },
  team:       { id: "team",       label: "Team ($25/seat)", monthlyUsd: 25,  window5h: { haiku: 200,   sonnet: 45,  opus: 30  } },
  enterprise: { id: "enterprise", label: "Enterprise",     monthlyUsd: null, window5h: { haiku: null,  sonnet: null, opus: null } },
  api:        { id: "api",        label: "API",            monthlyUsd: null, window5h: { haiku: null,  sonnet: null, opus: null } },
};

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

export function modelToTier(modelId: string): ModelTier {
  const id = modelId.toLowerCase();
  if (id.includes("haiku")) return "haiku";
  if (id.includes("opus")) return "opus";
  return "sonnet";
}

export function getQuotaImpact(opts: {
  estimatedTokens: number;
  model: string;
  plan: PlanId;
}): QuotaImpact {
  const plan = PLANS[opts.plan];
  const modelTier = modelToTier(opts.model);
  const windowLimit = plan.window5h[modelTier];
  const equivalentMessages = Math.max(1, Math.round(opts.estimatedTokens / TYPICAL_TOKENS_PER_MESSAGE));

  if (windowLimit === null) {
    return { plan: opts.plan, modelTier, equivalentMessages, percentOf5hWindow: null, remainingMessagesIn5h: null, unlimited: true };
  }

  const percentOf5hWindow = parseFloat(((equivalentMessages / windowLimit) * 100).toFixed(1));
  const remainingMessagesIn5h = Math.max(0, windowLimit - equivalentMessages);
  return { plan: opts.plan, modelTier, equivalentMessages, percentOf5hWindow, remainingMessagesIn5h, unlimited: false };
}
