"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Meter } from "@/components/ui/Meter";
import { Check, Copy, ChevronDown, ChevronUp } from "lucide-react";

export function RefinerPanel() {
  const refinerResult = useApp((s) => s.refinerResult);
  const [copied, setCopied] = useState(false);
  const [passesExpanded, setPassesExpanded] = useState(false);

  if (!refinerResult) {
    return (
      <Card title="Prompt refiner" subtitle="Awaiting input">
        <p className="text-sm text-text-dim">No data yet.</p>
      </Card>
    );
  }

  const { original, refined, passes, savedTokens, savedPct, specificityScore, warnings } = refinerResult;
  const appliedPasses = passes.filter((p) => p.applied);
  const scoreBefore = Math.round((original.length / 4) > 0 ? Math.min(100, specificityScore) : 0);
  const scoreAfter = specificityScore;
  const nothingToRefine = appliedPasses.length === 0 && savedTokens === 0;

  function copyRefined() {
    navigator.clipboard.writeText(refined).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card
      title="Prompt refiner"
      subtitle={
        nothingToRefine
          ? "Prompt is already well-formed."
          : `${appliedPasses.length} pass${appliedPasses.length === 1 ? "" : "es"} applied · ~${savedTokens} tokens saved`
      }
      action={
        savedTokens > 0 ? (
          <Badge tone="ok">-{savedPct}% tokens</Badge>
        ) : undefined
      }
    >
      {warnings.length > 0 && (
        <div className="mb-3 space-y-1">
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-warn">{w}</p>
          ))}
        </div>
      )}

      {/* Specificity score bars */}
      <div className="space-y-2">
        <Meter
          value={scoreBefore}
          max={100}
          label="Specificity (original)"
          zones={[
            { from: 0, to: 39, tone: "danger" },
            { from: 40, to: 69, tone: "warn" },
            { from: 70, to: 100, tone: "ok" },
          ]}
        />
        <Meter
          value={scoreAfter}
          max={100}
          label="Specificity (refined)"
          zones={[
            { from: 0, to: 39, tone: "danger" },
            { from: 40, to: 69, tone: "warn" },
            { from: 70, to: 100, tone: "ok" },
          ]}
        />
      </div>

      {nothingToRefine ? (
        <p className="mt-4 text-sm text-text-dim">
          Nothing to refine — prompt is already well-formed.
        </p>
      ) : (
        <>
          {/* Applied passes summary */}
          {appliedPasses.length > 0 && (
            <div className="mt-4">
              <button
                className="flex w-full items-center justify-between text-xs text-text-muted hover:text-text"
                onClick={() => setPassesExpanded((v) => !v)}
              >
                <span className="font-medium uppercase tracking-wide">What changed</span>
                {passesExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              {passesExpanded && (
                <ul className="mt-2 space-y-1.5">
                  {appliedPasses.map((p) => (
                    <li key={p.pass} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <div>
                        <span className="text-text">{p.name}</span>
                        {p.suggestions[0] && (
                          <span className="ml-1 text-text-dim">
                            — {p.suggestions[0].label}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Refined prompt output */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Refined prompt
              </span>
              <Button size="sm" variant="ghost" onClick={copyRefined}>
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-ok" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md border border-border-subtle bg-bg-subtle/60 px-3 py-2.5 font-mono text-xs text-text leading-relaxed">
              {refined}
            </pre>
          </div>
        </>
      )}
    </Card>
  );
}
