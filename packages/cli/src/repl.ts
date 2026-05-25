import prompts from "prompts";
import ora from "ora";
import { analyze } from "@ctok/core";
import type { EstimatorInput } from "@ctok/core";
import { refine } from "@ctok/refiner";
import { scan } from "@ctok/scanner";
import { getQuotaImpact, detectPlan } from "@ctok/quota";
import { appendHistory } from "./history";
import { header, kvTable, scoreBar, fmtTokens, fmtUsd, fmtPct, c, divider } from "./output/format";

export async function runRepl(): Promise<void> {
  process.stdout.write(`\n  ${c.brand("ctok")}  ${c.dim("Lighthouse for Claude prompts")}\n`);
  process.stdout.write(`  ${c.dim("Type your prompt below. Press Ctrl+C to exit.")}\n\n`);

  // Optionally scan cwd
  const cwd = process.cwd();
  let projectInfo = "";
  try {
    const spinner = ora({ text: c.dim(`Scanning ${cwd}...`), color: "cyan" }).start();
    const scanResult = await scan({ root: cwd, topHeavyCount: 5 });
    spinner.stop();
    if (scanResult.totalFiles > 0) {
      projectInfo = `${scanResult.projectType} project — ${scanResult.totalFiles} files — ${fmtTokens(scanResult.estimatedTokens)} tokens`;
      process.stdout.write(`  ${c.dim("Project:")} ${projectInfo}\n\n`);
    }
  } catch {
    // scan failed (not in a project) — silent
  }

  while (true) {
    const response = await prompts(
      {
        type: "text",
        name: "prompt",
        message: "Prompt",
        validate: (v: string) => v.trim().length > 0 || "Enter a prompt",
      },
      { onCancel: () => process.exit(0) },
    );

    const promptText: string = response.prompt?.trim() ?? "";
    if (!promptText) continue;

    const spinner = ora({ text: "Analysing…", color: "cyan" }).start();

    const input: EstimatorInput = { prompt: promptText, files: [], taskType: "general" };
    const result = analyze(input);
    const refineResult = refine({ prompt: promptText });
    const plan = detectPlan();
    const quota = getQuotaImpact({
      estimatedTokens: result.estimate.input.expected + result.estimate.output.expected,
      model: result.cost.model,
      plan: plan.planId,
    });

    spinner.stop();

    appendHistory({ prompt: promptText, result });

    // Output
    process.stdout.write(header("Estimate") + "\n");
    process.stdout.write(
      kvTable([
        ["Input tokens", fmtTokens(result.estimate.input.expected)],
        ["Output tokens", fmtTokens(result.estimate.output.expected)],
        ["Context", fmtPct(result.estimate.input.expected / 200_000)],
        ["Cost", c.bold(fmtUsd(result.cost.totalUsd))],
        ["Model", c.ok(result.recommendation.model.model)],
        ["Effort", c.ok(result.recommendation.effort.effort)],
      ]) + "\n",
    );

    if (!quota.unlimited && quota.percentOf5hWindow !== null) {
      process.stdout.write(
        `  ${c.dim("Quota:")} ${fmtPct(quota.percentOf5hWindow)} of your ${plan.planId} 5h window\n\n`,
      );
    }

    // Refiner
    if (refineResult.passes.some((p) => p.applied)) {
      process.stdout.write(header("Refiner") + "\n");
      process.stdout.write(
        kvTable([
          ["Specificity", scoreBar(refineResult.specificityScore, 16)],
          ["Tokens saved", refineResult.savedTokens > 0 ? c.ok(`~${fmtTokens(refineResult.savedTokens)} (${refineResult.savedPct}%)`) : c.dim("< 1%")],
          ["Passes applied", refineResult.passes.filter((p) => p.applied).map((p) => p.pass).join(", ")],
        ]) + "\n",
      );
    } else {
      process.stdout.write(
        `  ${c.dim("Refiner:")} ${c.ok("prompt is already well-formed")}\n\n`,
      );
    }

    process.stdout.write(divider() + "\n\n");

    // Ask what to do next
    const next = await prompts(
      {
        type: "select",
        name: "action",
        message: "Next",
        choices: [
          { title: "New prompt", value: "new" },
          { title: "Show refined prompt", value: "refined" },
          { title: "Show full analysis JSON", value: "json" },
          { title: "Exit", value: "exit" },
        ],
      },
      { onCancel: () => process.exit(0) },
    );

    if (next.action === "exit") break;
    if (next.action === "refined") {
      process.stdout.write("\n" + refineResult.refined + "\n\n");
    }
    if (next.action === "json") {
      process.stdout.write(JSON.stringify({ result, refineResult }, null, 2) + "\n\n");
    }
  }

  process.stdout.write(c.dim("\nBye!\n"));
}
