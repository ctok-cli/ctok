"use client";

import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Meter } from "@/components/ui/Meter";
import type { EffortLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const EFFORT_ORDER: { id: EffortLevel; label: string; desc: string }[] = [
  { id: "low", label: "Low", desc: "Tight, fast, cheap." },
  { id: "medium", label: "Medium", desc: "Reasoned but bounded." },
  { id: "high", label: "High", desc: "Extra thinking for tricky work." },
  { id: "xhigh", label: "Extra-high", desc: "Maximum - irreversible decisions." },
];

export function EffortRecommendation() {
  const outputs = useApp((s) => s.outputs);
  if (!outputs) {
    return (
      <Card title="Effort recommendation" subtitle="Awaiting input">
        <p className="text-sm text-text-dim">No data yet.</p>
      </Card>
    );
  }
  const rec = outputs.recommendation.effort;
  const complexity = outputs.recommendation.complexity;

  return (
    <Card
      title="Effort recommendation"
      subtitle="Higher effort = more thinking tokens, better correctness on hard problems."
      action={
        <Badge tone={complexity.band === "deep" ? "danger" : complexity.band === "normal" ? "warn" : "ok"}>
          {complexity.band} · score {complexity.score}
        </Badge>
      }
    >
      <Meter
        label="Complexity score"
        value={complexity.score}
        max={100}
        zones={[
          { from: 0, to: 29, tone: "ok" },
          { from: 30, to: 64, tone: "warn" },
          { from: 65, to: 100, tone: "danger" },
        ]}
      />

      <div className="mt-4 grid grid-cols-4 gap-2">
        {EFFORT_ORDER.map((e) => {
          const active = e.id === rec.effort;
          return (
            <div
              key={e.id}
              className={cn(
                "rounded-md border p-2 text-center",
                active ? "border-accent bg-accent/10" : "border-border bg-bg-subtle opacity-70",
              )}
            >
              <div className={cn("text-sm font-medium", active ? "text-accent" : "text-text-muted")}>
                {e.label}
              </div>
              <div className="mt-0.5 text-[10px] text-text-dim">{e.desc}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-md border border-border-subtle bg-bg-subtle/50 p-3">
        <h4 className="text-xs font-medium uppercase tracking-wide text-text-muted">Why</h4>
        <p className="mt-1 text-sm text-text">{rec.reason}</p>
      </div>

      <details className="mt-3 text-xs text-text-muted">
        <summary className="cursor-pointer text-text-muted hover:text-text">Complexity signals</summary>
        <ul className="mt-2 space-y-0.5">
          {complexity.signals.map((s, i) => (
            <li key={i} className="flex justify-between font-mono">
              <span>{s.label}</span>
              <span className={cn(s.weight >= 0 ? "text-text" : "text-ok")}>
                {s.weight > 0 ? "+" : ""}
                {s.weight}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </Card>
  );
}
