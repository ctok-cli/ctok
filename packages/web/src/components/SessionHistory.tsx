"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatNumber, formatUsd, truncate } from "@/lib/utils";
import { PRICING } from "@/lib/pricing";
import type { ActualUsage, SessionEntry } from "@/lib/types";
import { ChevronDown, Trash2 } from "lucide-react";

export function SessionHistory() {
  const { history, deleteHistoryEntry, clearHistory } = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Card
      title="Session history"
      subtitle={
        history.length === 0
          ? "Save snapshots after estimating to track over time."
          : `${history.length} saved snapshot${history.length === 1 ? "" : "s"} (local only)`
      }
      action={
        history.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => clearHistory()}>
            Clear all
          </Button>
        )
      }
    >
      {history.length === 0 ? (
        <p className="text-sm text-text-dim">
          Use “Save snapshot” on the right column to log this estimate. Later, record actual token usage and we'll compare.
        </p>
      ) : (
        <ul className="space-y-2">
          {history.map((entry) => (
            <HistoryRow
              key={entry.id}
              entry={entry}
              expanded={expanded === entry.id}
              onToggle={() => setExpanded((id) => (id === entry.id ? null : entry.id))}
              onDelete={() => deleteHistoryEntry(entry.id)}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

function HistoryRow({
  entry,
  expanded,
  onToggle,
  onDelete,
}: {
  entry: SessionEntry;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { recordActual } = useApp();
  const [actualIn, setActualIn] = useState(entry.actual?.inputTokens?.toString() ?? "");
  const [actualOut, setActualOut] = useState(entry.actual?.outputTokens?.toString() ?? "");

  function commitActual() {
    const i = parseInt(actualIn, 10);
    const o = parseInt(actualOut, 10);
    if (!Number.isFinite(i) || !Number.isFinite(o)) return;
    const usage: ActualUsage = { inputTokens: i, outputTokens: o, model: entry.cost.model };
    recordActual(entry.id, usage);
  }

  const created = new Date(entry.createdAt).toLocaleString();
  const actualTotal = entry.actual ? entry.actual.inputTokens + entry.actual.outputTokens : null;
  const delta =
    actualTotal != null
      ? actualTotal - entry.estimate.totalExpected
      : null;
  const deltaPct =
    actualTotal != null && entry.estimate.totalExpected > 0
      ? Math.round((delta! / entry.estimate.totalExpected) * 100)
      : null;

  return (
    <li className="rounded-md border border-border-subtle bg-bg-subtle/40">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2 text-left"
      >
        <ChevronDown
          className={`h-4 w-4 text-text-dim transition-transform ${expanded ? "rotate-180" : ""}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge tone="neutral">{entry.taskType}</Badge>
            <span className="truncate text-sm text-text">
              {truncate(entry.promptPreview || "(no prompt)", 80)}
            </span>
          </div>
          <div className="mt-0.5 text-[11px] text-text-dim">
            {created} · est ~{formatNumber(entry.estimate.totalExpected)} tok · {formatUsd(entry.cost.totalUsd)} ·{" "}
            {PRICING[entry.cost.model].label}
          </div>
        </div>
        {actualTotal != null && (
          <Badge tone={Math.abs(deltaPct ?? 0) <= 25 ? "ok" : Math.abs(deltaPct ?? 0) <= 60 ? "warn" : "danger"}>
            actual {formatNumber(actualTotal)} ({deltaPct! >= 0 ? "+" : ""}
            {deltaPct}%)
          </Badge>
        )}
        <button
          aria-label="Delete"
          className="rounded p-1 text-text-dim hover:bg-bg-subtle hover:text-danger"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </button>

      {expanded && (
        <div className="border-t border-border-subtle px-3 py-3">
          <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
            <KV k="Est input" v={formatNumber(entry.estimate.input.expected)} />
            <KV k="Est output" v={formatNumber(entry.estimate.output.expected)} />
            <KV k="Confidence" v={entry.estimate.confidence} />
            <KV k="Complexity" v={`${entry.recommendation.complexity.band} (${entry.recommendation.complexity.score})`} />
            <KV k="Picked model" v={PRICING[entry.recommendation.model.model].label} />
            <KV k="Effort" v={entry.recommendation.effort.effort} />
            <KV k="Est cost" v={formatUsd(entry.cost.totalUsd)} />
            <KV k="Model used" v={PRICING[entry.cost.model].label} />
          </div>

          <div className="mt-4 rounded-md border border-border-subtle bg-bg p-3">
            <h4 className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Record actual usage
            </h4>
            <p className="mt-1 text-[11px] text-text-dim">
              From the Claude Code status line or API response after the task ran.
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <label className="text-xs text-text-muted">
                Input tokens
                <input
                  type="number"
                  value={actualIn}
                  onChange={(e) => setActualIn(e.target.value)}
                  className="mt-1 block w-32 rounded border border-border bg-bg-subtle px-2 py-1 text-sm text-text"
                />
              </label>
              <label className="text-xs text-text-muted">
                Output tokens
                <input
                  type="number"
                  value={actualOut}
                  onChange={(e) => setActualOut(e.target.value)}
                  className="mt-1 block w-32 rounded border border-border bg-bg-subtle px-2 py-1 text-sm text-text"
                />
              </label>
              <Button size="sm" variant="primary" onClick={commitActual}>
                Save actual
              </Button>
            </div>

            {entry.actual && (
              <div className="mt-3 rounded border border-border-subtle bg-bg-subtle/50 p-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Estimated total</span>
                  <span className="font-mono text-text">{formatNumber(entry.estimate.totalExpected)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Actual total</span>
                  <span className="font-mono text-text">
                    {formatNumber(entry.actual.inputTokens + entry.actual.outputTokens)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Delta</span>
                  <span
                    className={
                      "font-mono " + (deltaPct! >= 0 ? "text-warn" : "text-ok")
                    }
                  >
                    {delta! >= 0 ? "+" : ""}
                    {formatNumber(delta!)} ({deltaPct! >= 0 ? "+" : ""}
                    {deltaPct}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded border border-border-subtle bg-bg-subtle/40 p-2">
      <div className="text-[10px] uppercase tracking-wide text-text-dim">{k}</div>
      <div className="mt-0.5 truncate font-mono text-text">{v}</div>
    </div>
  );
}
