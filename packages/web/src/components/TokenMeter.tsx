"use client";

import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Meter } from "@/components/ui/Meter";
import { Badge } from "@/components/ui/Badge";
import { formatNumber } from "@/lib/utils";

const CONTEXT_WINDOW = 200_000;

export function TokenMeter() {
  const outputs = useApp((s) => s.outputs);
  if (!outputs) {
    return (
      <Card title="Token estimate" subtitle="Awaiting input">
        <p className="text-sm text-text-dim">
          Enter a prompt or attach files to see token estimates.
        </p>
      </Card>
    );
  }

  const { estimate } = outputs;
  const confTone = estimate.confidence === "high" ? "ok" : estimate.confidence === "medium" ? "warn" : "danger";

  return (
    <Card
      title="Token estimate"
      subtitle="Heuristic — not byte-exact. Use ranges, not the middle number."
      action={<Badge tone={confTone}>{estimate.confidence} confidence</Badge>}
    >
      <div className="grid grid-cols-3 gap-4">
        <Stat
          label="Input tokens"
          expected={estimate.input.expected}
          min={estimate.input.min}
          max={estimate.input.max}
        />
        <Stat
          label="Output (est.)"
          expected={estimate.output.expected}
          min={estimate.output.min}
          max={estimate.output.max}
        />
        <Stat
          label="Total turn"
          expected={estimate.totalExpected}
          min={estimate.input.min + estimate.output.min}
          max={estimate.input.max + estimate.output.max}
        />
      </div>

      <div className="mt-5 space-y-3">
        <Meter
          label={`Context window used (of ${formatNumber(CONTEXT_WINDOW)})`}
          value={estimate.input.expected}
          max={CONTEXT_WINDOW}
          zones={[
            { from: 0, to: CONTEXT_WINDOW * 0.5, tone: "ok" },
            { from: CONTEXT_WINDOW * 0.5, to: CONTEXT_WINDOW * 0.8, tone: "warn" },
            { from: CONTEXT_WINDOW * 0.8, to: CONTEXT_WINDOW * 2, tone: "danger" },
          ]}
        />
      </div>

      {estimate.chunks.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
            Per-chunk breakdown
          </h3>
          <div className="overflow-hidden rounded-md border border-border-subtle">
            <table className="w-full text-xs">
              <thead className="bg-bg-subtle text-text-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Source</th>
                  <th className="px-3 py-2 text-left font-medium">Kind</th>
                  <th className="px-3 py-2 text-right font-medium">Chars</th>
                  <th className="px-3 py-2 text-right font-medium">~Tokens</th>
                  <th className="px-3 py-2 text-right font-medium">char/tok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {estimate.chunks.map((c, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 font-mono text-text">{c.label}</td>
                    <td className="px-3 py-1.5"><Badge tone="neutral">{c.kind}</Badge></td>
                    <td className="px-3 py-1.5 text-right font-mono text-text-muted">{formatNumber(c.chars)}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-text">{formatNumber(c.tokens)}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-text-dim">{c.ratio.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}

function Stat({
  label,
  expected,
  min,
  max,
}: {
  label: string;
  expected: number;
  min: number;
  max: number;
}) {
  return (
    <div className="rounded-md border border-border-subtle bg-bg-subtle/50 p-3">
      <div className="text-[11px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className="mt-1 font-mono text-2xl font-medium text-text">{formatNumber(expected)}</div>
      <div className="mt-0.5 font-mono text-[11px] text-text-dim">
        range {formatNumber(min)}–{formatNumber(max)}
      </div>
    </div>
  );
}
