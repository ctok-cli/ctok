import chalk from "chalk";
import Table from "cli-table3";

export const c = {
  brand: (s: string) => chalk.cyan.bold(s),
  ok: (s: string) => chalk.green(s),
  warn: (s: string) => chalk.yellow(s),
  danger: (s: string) => chalk.red(s),
  dim: (s: string) => chalk.dim(s),
  bold: (s: string) => chalk.bold(s),
  label: (s: string) => chalk.white.bold(s),
};

export function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function fmtUsd(n: number): string {
  if (n < 0.001) return "< $0.001";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(3)}`;
}

export function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function header(title: string): string {
  return `\n${c.brand("●")} ${c.bold(title)}`;
}

export function divider(): string {
  return c.dim("─".repeat(56));
}

export function kvTable(rows: Array<[string, string]>): string {
  const t = new Table({
    chars: {
      top: "", "top-mid": "", "top-left": "", "top-right": "",
      bottom: "", "bottom-mid": "", "bottom-left": "", "bottom-right": "",
      left: "", "left-mid": "", mid: "", "mid-mid": "",
      right: "", "right-mid": "", middle: "  ",
    },
    style: { border: [], head: [] },
  });
  for (const [k, v] of rows) {
    t.push([c.dim(k), v]);
  }
  return t.toString();
}

export function colTable(head: string[], rows: string[][]): string {
  const t = new Table({
    head: head.map((h) => c.bold(h)),
    style: { border: ["dim"], head: [] },
  });
  for (const row of rows) {
    t.push(row);
  }
  return t.toString();
}

export function scoreBar(score: number, width = 20): string {
  const filled = Math.round((score / 100) * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  const colour = score >= 70 ? c.ok : score >= 40 ? c.warn : c.danger;
  return `${colour(bar)} ${c.bold(String(score))}/100`;
}

export function printJson(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + "\n");
}
