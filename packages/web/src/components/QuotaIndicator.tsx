"use client";

import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Meter } from "@/components/ui/Meter";
import { PLANS, PLAN_IDS } from "@/lib/quota";
import type { PlanId } from "@/lib/quota";
import { cn } from "@/lib/utils";

export function QuotaIndicator() {
  const outputs = useApp((s) => s.outputs);
  const quotaImpact = useApp((s) => s.quotaImpact);
  const planId = useApp((s) => s.planId);
  const setPlanId = useApp((s) => s.setPlanId);

  if (!outputs) {
    return (
      <Card title="Quota impact" subtitle="Awaiting input">
        <p className="text-sm text-text-dim">No data yet.</p>
      </Card>
    );
  }

  const isUnlimited = quotaImpact?.unlimited ?? false;
  const pct = quotaImpact?.percentOf5hWindow ?? 0;
  const remaining = quotaImpact?.remainingMessagesIn5h ?? null;
  const tier = quotaImpact?.modelTier ?? "sonnet";

  return (
    <Card
      title="Quota impact"
      subtitle={`${PLANS[planId].label} · ${tier} model tier`}
    >
      {/* Plan chips */}
      <div className="flex flex-wrap gap-1.5">
        {PLAN_IDS.map((id: PlanId) => (
          <button
            key={id}
            onClick={() => setPlanId(id)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
              id === planId
                ? "border-accent/40 bg-accent/15 text-accent"
                : "border-border bg-bg-subtle text-text-muted hover:border-border-subtle hover:text-text",
            )}
          >
            {PLANS[id].label}
          </button>
        ))}
      </div>

      {/* Meter / unlimited message */}
      <div className="mt-4">
        {isUnlimited ? (
          <p className="text-sm text-text-muted">
            {planId === "enterprise" || planId === "api"
              ? "No message quota — billed per token."
              : "Unlimited quota."}
          </p>
        ) : (
          <>
            <Meter
              value={pct}
              max={100}
              label="5h window used"
              zones={[
                { from: 0, to: 49, tone: "ok" },
                { from: 50, to: 79, tone: "warn" },
                { from: 80, to: 100, tone: "danger" },
              ]}
            />
            <p className="mt-2 text-xs text-text-dim">
              {pct >= 100
                ? "⚠ Exceeds estimated window budget — consider splitting or switching model."
                : remaining !== null
                  ? `~${remaining} similar prompts remaining in this window.`
                  : null}
            </p>
          </>
        )}
      </div>

      <p className="mt-3 text-[10px] text-text-dim">
        Estimated — Anthropic does not expose exact quota via API.
      </p>
    </Card>
  );
}
