import * as fs from "node:fs";
import * as readline from "node:readline";
import ora from "ora";
import { refine, specificityScore } from "@ctok/refiner";
import { CtokError } from "../error";
import { header, kvTable, scoreBar, c, fmtTokens, printJson, divider } from "../output/format";
import { renderSideBySide, renderScoreDelta, renderInlineDiff } from "../output/diff";
import { trackEvent } from "../telemetry";
import { readCtokConfig } from "@ctok/quota";
import type { LlmModel } from "@ctok/refiner-llm";

async function readStdin(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin });
  const lines: string[] = [];
  for await (const line of rl) lines.push(line);
  return lines.join("\n");
}

export interface RefineOptions {
  file?: string;
  interactive?: boolean;
  auto?: boolean;
  json?: boolean;
  quiet?: boolean;
  llm?: boolean;
  llmModel?: string;
  apiKey?: string;
  diff?: boolean;
}

export async function runRefine(promptArg: string | undefined, opts: RefineOptions): Promise<void> {
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
      'Usage: ctok refine "<prompt>" | ctok refine -f prompt.md | ctok refine -i',
    );
  }

  promptText = promptText.trim();

  trackEvent("refine", { auto: !!opts.auto, interactive: !!opts.interactive, llm: !!opts.llm, diff: !!opts.diff });

  // LLM path
  if (opts.llm) {
    return runRefineLlm(promptText, opts);
  }

  const spinner = ora({ text: "Refining prompt…", color: "cyan" }).start();
  let result: ReturnType<typeof refine>;
  try {
    result = refine({ prompt: promptText });
    spinner.stop();
  } catch (err) {
    spinner.stop();
    throw err;
  }

  const beforeScore = specificityScore(promptText);
  const afterScore = result.specificityScore;

  if (opts.json) {
    printJson({ ...result, beforeScore, afterScore });
    return;
  }

  if (opts.quiet) {
    process.stdout.write(result.refined + "\n");
    return;
  }

  // --diff: side-by-side viral hook
  if (opts.diff) {
    process.stdout.write(header("Prompt refiner — diff view") + "\n\n");
    process.stdout.write(renderSideBySide(result.original, result.refined) + "\n\n");
    process.stdout.write(renderScoreDelta(beforeScore, afterScore, result.savedTokens, result.savedPct) + "\n\n");
    process.stdout.write(header("Inline diff") + "\n");
    process.stdout.write(renderInlineDiff(result.original, result.refined) + "\n\n");
    process.stdout.write(divider() + "\n");
    process.stdout.write(`  ${c.dim("Share this:")}  ctok refine --diff "<your prompt>"\n\n`);
    return;
  }

  // Header + score
  process.stdout.write(header("Prompt refiner") + "\n");
  process.stdout.write(
    kvTable([
      ["Specificity (original)", scoreBar(beforeScore, 20)],
      ["Specificity (refined)", scoreBar(afterScore, 20)],
      ["Tokens saved", result.savedTokens > 0 ? c.ok(`~${fmtTokens(result.savedTokens)} (${result.savedPct}%)`) : c.dim("< 1%")],
    ]) + "\n",
  );

  // Applied passes
  const applied = result.passes.filter((p) => p.applied);
  if (applied.length > 0) {
    process.stdout.write(header("What changed") + "\n");
    for (const pass of applied) {
      process.stdout.write(`  ${c.warn("▸")} ${c.bold(pass.name)}\n`);
      const top = pass.suggestions.slice(0, 3);
      for (const sg of top) {
        const orig = sg.original.slice(0, 50).replace(/\n/g, "↵");
        const repl = sg.replacement.slice(0, 50).replace(/\n/g, "↵");
        if (repl) {
          process.stdout.write(`    ${c.dim(orig)} → ${repl}\n`);
        } else {
          process.stdout.write(`    ${c.dim(`remove: "${orig}"`)}\n`);
        }
      }
      if (pass.suggestions.length > 3) {
        process.stdout.write(`    ${c.dim(`… and ${pass.suggestions.length - 3} more`)}\n`);
      }
    }
    process.stdout.write("\n");
  } else {
    process.stdout.write(`  ${c.ok("✓")} No changes needed — prompt is already well-formed.\n\n`);
  }

  // Warnings
  for (const w of result.warnings) {
    process.stdout.write(`  ${c.warn("⚠")} ${w}\n`);
  }

  // Refined output
  process.stdout.write(header("Refined prompt") + "\n");
  process.stdout.write(c.dim("┌") + "\n");
  for (const line of result.refined.split("\n")) {
    process.stdout.write(`${c.dim("│")} ${line}\n`);
  }
  process.stdout.write(c.dim("└") + "\n\n");

  process.stdout.write(divider() + "\n");
  process.stdout.write(
    `  Copy the refined prompt above. Run ${c.brand("ctok check")} to re-estimate tokens.\n\n`,
  );
}

async function runRefineLlm(promptText: string, opts: RefineOptions): Promise<void> {
  // Dynamically import so the heavy AI SDK is only loaded when --llm is used
  type RefineLlmFn = typeof import("@ctok/refiner-llm").refineLlm;
  let refineLlm: RefineLlmFn;
  try {
    const mod = await import("@ctok/refiner-llm") as { refineLlm: RefineLlmFn };
    refineLlm = mod.refineLlm;
  } catch {
    throw new CtokError(
      "E_LLM_NOT_INSTALLED",
      "@ctok/refiner-llm is not installed.",
      "Run: npm i -g @ctok/refiner-llm",
    );
  }

  // Resolve API key: --api-key flag → env var → ctok config
  const apiKey: string | undefined =
    opts.apiKey ??
    process.env["ANTHROPIC_API_KEY"] ??
    (() => {
      try {
        return readCtokConfig("anthropic-key") as string | undefined;
      } catch {
        return undefined;
      }
    })();

  const llmModel = (opts.llmModel || undefined) as LlmModel | undefined;

  const spinner = ora({ text: "Calling Claude to refine prompt…", color: "cyan" }).start();

  let result: Awaited<ReturnType<typeof refineLlm>>;
  try {
    result = await refineLlm(promptText, { apiKey, model: llmModel });
    spinner.stop();
  } catch (err) {
    spinner.stop();
    throw err;
  }

  if (!opts.json && !opts.quiet) {
    process.stdout.write(header("Prompt refiner") + ` ${c.brand("[LLM mode]")}\n`);
  }

  if (opts.json) {
    printJson(result);
    return;
  }

  if (opts.quiet) {
    process.stdout.write(result.refined + "\n");
    return;
  }

  process.stdout.write(
    kvTable([
      ["Model", result.model],
      ["Tokens saved", result.savedTokens > 0
        ? c.ok(`~${fmtTokens(result.savedTokens)} (${result.savedPct}%)`)
        : c.dim("< 1%")],
      ...(result.refineCallInputTokens !== undefined
        ? [["Refine call cost", `${fmtTokens(result.refineCallInputTokens)} in / ${fmtTokens(result.refineCallOutputTokens ?? 0)} out`] as [string, string]]
        : []),
    ]) + "\n",
  );

  process.stdout.write(header("Refined prompt") + "\n");
  process.stdout.write(c.dim("┌") + "\n");
  for (const line of result.refined.split("\n")) {
    process.stdout.write(`${c.dim("│")} ${line}\n`);
  }
  process.stdout.write(c.dim("└") + "\n\n");

  process.stdout.write(divider() + "\n");
  process.stdout.write(
    `  Copy the refined prompt above. Run ${c.brand("ctok check")} to re-estimate tokens.\n\n`,
  );
}
