import * as fs from "node:fs";
import * as readline from "node:readline";
import ora from "ora";
import { analyze } from "@ctok/core";
import { CtokError } from "../error";
import type { EstimatorInput } from "@ctok/core";
import { getQuotaImpact, detectPlan } from "@ctok/quota";
import { appendHistory } from "../history";
import { header, kvTable, fmtTokens, fmtUsd, fmtPct, divider, c, printJson } from "../output/format";
import { trackEvent } from "../telemetry";

async function readStdin(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin });
  const lines: string[] = [];
  for await (const line of rl) lines.push(line);
  return lines.join("\n");
}

const VALID_TASK_TYPES: string[] = [
  "bug-fix", "feature", "refactor", "debugging", "review", "documentation", "architecture", "general",
];

export interface CheckOptions {
  file?: string;
  model?: string;
  taskType?: string;
  json?: boolean;
  quiet?: boolean;
  save?: boolean;
}

export async function runCheck(promptArg: string | undefined, opts: CheckOptions): Promise<void> {
  // Resolve prompt text
  let promptText: string;
  if (opts.file) {
    promptText = fs.readFileSync(opts.file, "utf8");
  } else if (promptArg === "-" || (!promptArg && !process.stdin.isTTY)) {
    promptText = await readStdin();
  } else if (promptArg) {
    promptText = promptArg;
  } else {
    throw new CtokError(
      "E_NO_PROMPT",
      "No prompt provided.",
      'Usage: ctok check "<prompt>" | ctok check -f prompt.md | echo "…" | ctok check -',
    );
  }

  promptText = promptText.trim();
  trackEvent("check", { has_file: !!opts.file, json: !!opts.json });
  if (!promptText) {
    throw new CtokError("E_EMPTY_PROMPT", "Prompt is empty.");
  }

  if (opts.taskType && !VALID_TASK_TYPES.includes(opts.taskType)) {
    throw new CtokError(
      "E_INVALID_TASK_TYPE",
      `Unknown task type: "${opts.taskType}".`,
      `Valid types: ${VALID_TASK_TYPES.join(" | ")}`,
    );
  }

  const spinner = ora({ text: "Estimating…", color: "cyan" }).start();
  const input: EstimatorInput = {
    prompt: promptText,
    files: [],
    taskType: (opts.taskType as import("@ctok/core").TaskType) ?? "general",
  };
  let result: ReturnType<typeof analyze>;
  try {
    result = analyze(input, opts.model as any);
    spinner.stop();
  } catch (err) {
    spinner.stop();
    throw err;
  }

  if (opts.save !== false) {
    appendHistory({ prompt: promptText, result });
  }

  if (opts.json) {
    printJson(result);
    return;
  }

  if (opts.quiet) {
    process.stdout.write(
      `${fmtTokens(result.estimate.input.expected)} tokens  ${fmtUsd(result.cost.totalUsd)}\n`,
    );
    return;
  }

  const { estimate, recommendation, cost, suggestions } = result;
  const plan = detectPlan();
  const quota = getQuotaImpact({
    estimatedTokens: estimate.input.expected + estimate.output.expected,
    model: cost.model,
    plan: plan.planId,
  });

  process.stdout.write(header("Token estimate") + "\n");
  process.stdout.write(
    kvTable([
      ["Input tokens", `${fmtTokens(estimate.input.expected)} (range ${fmtTokens(estimate.input.min)}-${fmtTokens(estimate.input.max)})`],
      ["Output tokens", `${fmtTokens(estimate.output.expected)} (range ${fmtTokens(estimate.output.min)}-${fmtTokens(estimate.output.max)})`],
      ["Context window", `${fmtPct(estimate.input.expected / 200_000)} of 200k`],
    ]) + "\n",
  );

  process.stdout.write(header("Cost") + "\n");
  process.stdout.write(
    kvTable([
      ["Model", c.bold(cost.model)],
      ["Input cost", fmtUsd(cost.inputUsd)],
      ["Output cost", fmtUsd(cost.outputUsd)],
      ["Total (expected)", c.bold(fmtUsd(cost.totalUsd))],
      ["Total (range)", `${fmtUsd(cost.totalUsdRange.min)} - ${fmtUsd(cost.totalUsdRange.max)}`],
    ]) + "\n",
  );

  process.stdout.write(header("Recommendation") + "\n");
  process.stdout.write(
    kvTable([
      ["Model", c.ok(recommendation.model.model)],
      ["Effort", c.ok(recommendation.effort.effort)],
      ["Why", recommendation.model.reason],
    ]) + "\n",
  );

  if (suggestions.length > 0) {
    process.stdout.write(header("Suggestions") + "\n");
    for (const s of suggestions) {
      process.stdout.write(`  ${c.warn("▸")} ${s.detail}\n`);
    }
    process.stdout.write("\n");
  }

  if (!quota.unlimited) {
    process.stdout.write(header("Quota impact") + "\n");
    process.stdout.write(
      kvTable([
        ["Plan", plan.planId],
        ["5h window", `${c.warn(fmtPct(quota.percentOf5hWindow!))} used by this prompt`],
        ["Remaining", `~${quota.remainingMessagesIn5h} similar prompts`],
      ]) + "\n",
    );
    process.stdout.write(`  ${c.dim("(estimated - exact quota not exposed by Anthropic API)")}\n\n`);
  }

  process.stdout.write(divider() + "\n");
  process.stdout.write(`  Run ${c.brand("ctok refine")} to improve this prompt and save tokens.\n\n`);
}
