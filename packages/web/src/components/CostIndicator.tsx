"use client";

import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatUsd } from "@/lib/utils";
import { PRICING } from "@/lib/pricing";

export function CostIndicator() {
  const outputs = useApp((s) => s.outputs);
  if (!outputs) {
    return (
      <Card title="Cost & risk" subtitle="Awaiting input">
        <p className="text-sm text-text-dim">No data yet.</p>
      </Card>
    );
  }

  const { cost, estimate } = outputs;
  const p = PRICING[cost.model];

  // Risk: combine cost + context-window pressure
  const ctxRatio = estimate.input.expected / 200_000;
  const risk: "ok" | "warn" | "danger" =
    cost.totalUsd >= 1 || ctxRatio >= 0.8
      ? "danger"
      : cost.totalUsd >= 0.25 || ctxRatio >= 0.5
        ? "warn"
        : "ok";

  const riskLabel =
    risk === "danger"
      ? "High - review suggestions before sending"
      : risk === "warn"
        ? "Moderate - consider trimming context"
        : "Low - ship it";

  return (
    <Card
      title="Cost & risk"
      subtitle={`At ${p.label} list pricing.`}
      action={<Badge tone={risk}>{risk}</Badge>}
    >
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Input cost" value={formatUsd(cost.inputUsd)} />
        <Stat label="Output cost" value={formatUsd(cost.outputUsd)} />
        <Stat label="Total (est.)" value={formatUsd(cost.totalUsd)} primary />
      </div>
      <div className="mt-3 font-mono text-[11px] text-text-dim">
        range {formatUsd(cost.totalUsdRange.min)} - {formatUsd(cost.totalUsdRange.max)} · {p.input.toFixed(2)}/M in · {p.output.toFixed(2)}/M out
      </div>
      <p className="mt-4 text-sm text-text-muted">{riskLabel}.</p>
    </Card>
  );
}

function Stat({
  label,
  value,
  primary,
}: {
  label: string;
  value: string;
  primary?: boolean;
}) {
  return (
    <div className="rounded-md border border-border-subtle bg-bg-subtle/50 p-3">
      <div className="text-[11px] uppercase tracking-wide text-text-muted">{label}</div>
      <div
        className={
          "mt-1 font-mono " +
          (primary ? "text-2xl font-medium text-accent" : "text-xl text-text")
        }
      >
        {value}
      </div>
    </div>
  );
}
