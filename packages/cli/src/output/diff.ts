import chalk from "chalk";
import { c } from "./format";

function tokenise(s: string): string[] {
  return s.split(/(\s+)/).filter((t) => t.length > 0);
}

export interface DiffOp {
  op: "=" | "-" | "+";
  value: string;
}

export function wordDiff(a: string, b: string): DiffOp[] {
  const aw = tokenise(a);
  const bw = tokenise(b);
  const n = aw.length;
  const m = bw.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (aw[i - 1] === bw[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  const ops: DiffOp[] = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (aw[i - 1] === bw[j - 1]) {
      ops.push({ op: "=", value: aw[i - 1]! });
      i--; j--;
    } else if (dp[i - 1]![j]! >= dp[i]![j - 1]!) {
      ops.push({ op: "-", value: aw[i - 1]! });
      i--;
    } else {
      ops.push({ op: "+", value: bw[j - 1]! });
      j--;
    }
  }
  while (i > 0) { ops.push({ op: "-", value: aw[i - 1]! }); i--; }
  while (j > 0) { ops.push({ op: "+", value: bw[j - 1]! }); j--; }
  ops.reverse();
  return ops;
}

export function renderInlineDiff(a: string, b: string): string {
  const ops = wordDiff(a, b);
  const out: string[] = [];
  for (const { op, value } of ops) {
    if (op === "=") out.push(c.dim(value));
    else if (op === "-") out.push(chalk.red.strikethrough(value));
    else out.push(chalk.green.underline(value));
  }
  return out.join("");
}

export function renderSideBySide(a: string, b: string, width = 38): string {
  const wrap = (s: string): string[] => {
    const lines: string[] = [];
    for (const para of s.split(/\n/)) {
      if (para.length === 0) {
        lines.push("");
        continue;
      }
      const words = para.split(" ");
      let cur = "";
      for (const w of words) {
        if (!cur) { cur = w; continue; }
        if ((cur + " " + w).length > width) {
          lines.push(cur);
          cur = w;
        } else {
          cur += " " + w;
        }
      }
      if (cur) lines.push(cur);
    }
    return lines;
  };

  const left = wrap(a);
  const right = wrap(b);
  const rows = Math.max(left.length, right.length);
  const lines: string[] = [];
  const pad = (s: string) => (s + " ".repeat(width)).slice(0, width);

  lines.push(c.bold(pad("Original")) + c.dim(" │ ") + c.bold("Refined"));
  lines.push(c.dim("─".repeat(width) + "─┼─" + "─".repeat(width)));

  for (let i = 0; i < rows; i++) {
    const l = left[i] ?? "";
    const r = right[i] ?? "";
    lines.push(chalk.red(pad(l)) + c.dim(" │ ") + chalk.green(pad(r)));
  }
  return lines.join("\n");
}

export function renderScoreDelta(before: number, after: number, savedTokens: number, savedPct: number): string {
  const arrow = after > before ? c.ok("▲") : after < before ? c.danger("▼") : c.dim("—");
  const delta = after - before;
  const deltaStr = delta === 0 ? "" : ` ${arrow} ${delta > 0 ? "+" : ""}${delta}`;
  const saved = savedTokens > 0
    ? c.ok(`saved ~${savedTokens} tokens (${savedPct}%)`)
    : c.dim("no token savings");
  return `${c.bold("Specificity")} ${before}/100 → ${c.bold(`${after}/100`)}${deltaStr}  •  ${saved}`;
}
