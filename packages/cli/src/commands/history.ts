import { getHistory, getHistoryEntry, clearHistory, historyToCsv } from "../history";
import { header, colTable, kvTable, fmtTokens, fmtUsd, c, printJson } from "../output/format";

export interface HistoryOptions {
  limit?: number;
  csv?: boolean;
  json?: boolean;
  clear?: boolean;
}

export interface DiffOptions {
  json?: boolean;
}

export function runHistory(opts: HistoryOptions): void {
  if (opts.clear) {
    clearHistory();
    process.stdout.write(c.ok("History cleared.\n"));
    return;
  }

  const entries = getHistory(opts.limit ?? 20);

  if (opts.json) {
    printJson(entries);
    return;
  }

  if (entries.length === 0) {
    process.stdout.write(c.dim("No history yet. Run `ctok check` to start.\n"));
    return;
  }

  if (opts.csv) {
    process.stdout.write(historyToCsv(entries) + "\n");
    return;
  }

  process.stdout.write(header("Recent estimations") + "\n");
  const rows = entries.map((e) => [
    c.dim(e.id),
    e.timestamp.slice(0, 19).replace("T", " "),
    e.prompt.slice(0, 40).replace(/\n/g, " ") + (e.prompt.length > 40 ? "…" : ""),
    fmtTokens(e.result.estimate.input.expected),
    fmtUsd(e.result.cost.totalUsd),
    e.result.recommendation.model.model.replace("claude-", ""),
  ]);
  process.stdout.write(
    colTable(["ID", "Time", "Prompt", "Tokens", "Cost", "Model"], rows) + "\n",
  );
}

export function runDiff(id1: string, id2: string, opts: DiffOptions): void {
  const e1 = getHistoryEntry(id1);
  const e2 = getHistoryEntry(id2);

  if (!e1) { process.stderr.write(`Entry not found: ${id1}\n`); process.exit(1); }
  if (!e2) { process.stderr.write(`Entry not found: ${id2}\n`); process.exit(1); }

  if (opts.json) {
    printJson({ a: e1, b: e2 });
    return;
  }

  const delta = (a: number, b: number) => {
    const d = b - a;
    const pct = a > 0 ? ((d / a) * 100).toFixed(1) : "n/a";
    const arrow = d > 0 ? c.danger(`+${fmtTokens(d)}`) : c.ok(fmtTokens(d));
    return `${arrow} (${pct}%)`;
  };

  process.stdout.write(header(`Diff: ${id1} vs ${id2}`) + "\n");
  process.stdout.write(
    kvTable([
      ["Prompt A", e1.prompt.slice(0, 60)],
      ["Prompt B", e2.prompt.slice(0, 60)],
      ["Input tokens", delta(e1.result.estimate.input.expected, e2.result.estimate.input.expected)],
      ["Output tokens", delta(e1.result.estimate.output.expected, e2.result.estimate.output.expected)],
      ["Total cost", delta(e1.result.cost.totalUsd * 1000, e2.result.cost.totalUsd * 1000) + " (mUSD)"],
      ["Model A", e1.result.recommendation.model.model],
      ["Model B", e2.result.recommendation.model.model],
    ]) + "\n",
  );
}
