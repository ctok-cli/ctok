"use client";

import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PRICING } from "@/lib/pricing";
import type { ModelId } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODEL_ORDER: ModelId[] = ["haiku-4-5", "sonnet-4-6", "opus-4-7"];

export function ModelRecommendation() {
  const { outputs, selectedModelOverride, setSelectedModelOverride } = useApp();
  if (!outputs) {
    return (
      <Card title="Model recommendation" subtitle="Awaiting input">
        <p className="text-sm text-text-dim">No data yet.</p>
      </Card>
    );
  }
  const rec = outputs.recommendation.model;
  const active: ModelId = selectedModelOverride ?? rec.model;

  return (
    <Card
      title="Model recommendation"
      subtitle="Override to recompute cost. Recommendation stays based on the task."
      action={
        selectedModelOverride && (
          <Button size="sm" variant="ghost" onClick={() => setSelectedModelOverride(null)}>
            Reset to recommended
          </Button>
        )
      }
    >
      <div className="grid gap-2 md:grid-cols-3">
        {MODEL_ORDER.map((m) => {
          const isRec = m === rec.model;
          const isActive = m === active;
          return (
            <button
              key={m}
              onClick={() => setSelectedModelOverride(m === rec.model ? null : m)}
              className={cn(
                "flex flex-col items-start rounded-md border p-3 text-left transition-colors",
                isActive
                  ? "border-accent bg-accent/10"
                  : "border-border bg-bg-subtle hover:border-border-subtle",
              )}
            >
              <div className="flex w-full items-center justify-between">
                <span className={cn("text-sm font-medium", isActive ? "text-accent" : "text-text")}>
                  {PRICING[m].label}
                </span>
                {isRec && <Badge tone="accent">Picked</Badge>}
              </div>
              <span className="mt-0.5 text-[11px] text-text-dim capitalize">{PRICING[m].tier}</span>
              <span className="mt-2 font-mono text-[11px] text-text-muted">
                ${PRICING[m].input.toFixed(2)}/M in · ${PRICING[m].output.toFixed(2)}/M out
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-md border border-border-subtle bg-bg-subtle/50 p-3">
        <h4 className="text-xs font-medium uppercase tracking-wide text-text-muted">Why this model</h4>
        <p className="mt-1 text-sm text-text">{rec.reason}</p>
        {rec.alternatives.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-text-muted">
            {rec.alternatives.map((a) => (
              <li key={a.model}>
                <span className="font-mono text-text">{PRICING[a.model].label}:</span> {a.reason}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
