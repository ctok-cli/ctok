import type { ParsedArgs } from "./types";

const VALID_SUBCOMMANDS = ["check", "refine", "scan", "help"] as const;

export function parseArgs(raw: string): ParsedArgs {
  const tokens = raw.trim().split(/\s+/);
  let model: string | undefined;
  let plan: string | undefined;
  let taskType: string | undefined;

  // Extract --flag value pairs
  const remaining: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === "--model" && i + 1 < tokens.length) {
      model = tokens[++i];
    } else if (t === "--plan" && i + 1 < tokens.length) {
      plan = tokens[++i];
    } else if ((t === "--task" || t === "--task-type") && i + 1 < tokens.length) {
      taskType = tokens[++i];
    } else {
      remaining.push(t);
    }
    i++;
  }

  const first = remaining[0]?.toLowerCase() ?? "";
  const isKnownSub = (VALID_SUBCOMMANDS as readonly string[]).includes(first);

  const subcommand = isKnownSub ? first : "check";
  const text = isKnownSub ? remaining.slice(1).join(" ") : remaining.join(" ");

  return { subcommand, text: text.trim(), model, plan, taskType };
}
