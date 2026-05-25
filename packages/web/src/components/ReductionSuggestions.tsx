"use client";

import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatNumber } from "@/lib/utils";
import { AlertTriangle, AlertOctagon, Info } from "lucide-react";

export function ReductionSuggestions() {
  const outputs = useApp((s) => s.outputs);
  if (!outputs) {
    return (
      <Card title="Reduction suggestions" subtitle="Awaiting input">
        <p className="text-sm text-text-dim">No data yet.</p>
      </Card>
    );
  }
  const list = outputs.suggestions;
  const totalSaving = list.reduce((a, s) => a + s.estimatedSavingTokens, 0);

  return (
    <Card
      title="Reduction suggestions"
      subtitle={
        list.length === 0
          ? "Nothing obvious to trim — looks lean."
          : `${list.length} suggestion${list.length === 1 ? "" : "s"} · ~${formatNumber(totalSaving)} tokens potential savings`
      }
    >
      {list.length === 0 ? (
        <p className="text-sm text-text-dim">
          Your context looks tight. If Claude still struggles, the issue is likely prompt clarity, not token bloat.
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((s) => (
            <li
              key={s.id}
              className="flex gap-3 rounded-md border border-border-subtle bg-bg-subtle/40 p-3"
            >
              <div className="mt-0.5">
                {s.severity === "danger" ? (
                  <AlertOctagon className="h-4 w-4 text-danger" />
                ) : s.severity === "warn" ? (
                  <AlertTriangle className="h-4 w-4 text-warn" />
                ) : (
                  <Info className="h-4 w-4 text-accent" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-text">{s.title}</h4>
                  <Badge
                    tone={
                      s.severity === "danger"
                        ? "danger"
                        : s.severity === "warn"
                          ? "warn"
                          : "neutral"
                    }
                  >
                    ~{formatNumber(s.estimatedSavingTokens)} saved
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-text-muted">{s.detail}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-accent">
                  Action: <span className="font-medium normal-case">{s.action}</span>
                  {s.target && <span className="ml-1 font-mono text-text-dim">→ {s.target}</span>}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
