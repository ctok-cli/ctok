import * as core from "@actions/core";
import * as fs from "node:fs";
import * as path from "node:path";
import { analyze } from "@ctok/core";
import { refine } from "@ctok/refiner";
import { getQuotaImpact } from "@ctok/quota";
import type { TaskType, ModelId } from "@ctok/core";

async function run(): Promise<void> {
  let promptText = core.getInput("prompt").trim();
  const filePath = core.getInput("file").trim();

  if (filePath) {
    const resolved = path.resolve(process.env["GITHUB_WORKSPACE"] ?? ".", filePath);
    if (!fs.existsSync(resolved)) {
      core.setFailed(`ctok: file not found: ${resolved}`);
      return;
    }
    promptText = fs.readFileSync(resolved, "utf8").trim();
  }

  if (!promptText) {
    core.setFailed("ctok: either `prompt` or `file` input must be provided and non-empty.");
    return;
  }

  const modelInput = core.getInput("model").trim() || undefined;
  const plan = core.getInput("plan").trim() || "pro";
  const taskType = (core.getInput("task-type").trim() || "general") as TaskType;
  const maxTokensStr = core.getInput("max-tokens").trim();
  const maxCostStr = core.getInput("max-cost-usd").trim();
  const withRefine = core.getInput("refine").trim().toLowerCase() === "true";

  const maxTokens = maxTokensStr ? parseInt(maxTokensStr, 10) : undefined;
  const maxCost = maxCostStr ? parseFloat(maxCostStr) : undefined;

  core.info(`ctok: analysing prompt (${promptText.length} chars)…`);

  const result = analyze(
    { prompt: promptText, files: [], taskType },
    modelInput as ModelId | undefined,
  );

  const { estimate, cost, recommendation, suggestions } = result;

  const quota = getQuotaImpact({
    estimatedTokens: estimate.input.expected + estimate.output.expected,
    model: cost.model,
    plan: plan as any,
  });

  core.setOutput("input-tokens", String(estimate.input.expected));
  core.setOutput("output-tokens", String(estimate.output.expected));
  core.setOutput("total-tokens", String(estimate.totalExpected));
  core.setOutput("input-cost-usd", String(cost.inputUsd));
  core.setOutput("output-cost-usd", String(cost.outputUsd));
  core.setOutput("total-cost-usd", String(cost.totalUsd));
  core.setOutput("model", cost.model);
  core.setOutput("recommended-model", recommendation.model.model);
  core.setOutput("recommended-effort", recommendation.effort.effort);
  core.setOutput("confidence", estimate.confidence);
  core.setOutput("quota-pct", quota.percentOf5hWindow != null ? String((quota.percentOf5hWindow * 100).toFixed(2)) : "");
  core.setOutput("suggestions", JSON.stringify(suggestions));

  if (withRefine) {
    core.info("ctok: running prompt refiner…");
    const refineResult = refine({ prompt: promptText });
    core.setOutput("refined-prompt", refineResult.refined);
    core.setOutput("tokens-saved", String(refineResult.savedTokens));

    if (refineResult.savedTokens > 0) {
      core.info(
        `ctok: refiner saved ~${refineResult.savedTokens} tokens (${refineResult.savedPct}%). ` +
        `Specificity score: ${refineResult.specificityScore}/100.`,
      );
    }
  }

  const quotaLine = quota.percentOf5hWindow != null
    ? `| Quota (5h window)   | ${(quota.percentOf5hWindow * 100).toFixed(1)}% |\n`
    : "";

  const suggestionLines = suggestions.length > 0
    ? suggestions.map((s) => `> ⚠️ **${s.title}** — ${s.detail} (save ~${s.estimatedSavingTokens} tokens)`).join("\n")
    : "> ✅ No reduction suggestions.";

  await core.summary
    .addHeading("⚡ ctok — Token estimate")
    .addTable([
      [{ data: "Metric", header: true }, { data: "Value", header: true }],
      ["Input tokens", `${estimate.input.expected} (range ${estimate.input.min}–${estimate.input.max})`],
      ["Output tokens", `${estimate.output.expected} (range ${estimate.output.min}–${estimate.output.max})`],
      ["Confidence", estimate.confidence],
      ["Context window", `${(estimate.input.expected / 200_000 * 100).toFixed(1)}% of 200k`],
      ["Total cost (expected)", `$${cost.totalUsd.toFixed(4)}`],
      ["Cost range", `$${cost.totalUsdRange.min.toFixed(4)} – $${cost.totalUsdRange.max.toFixed(4)}`],
      ["Model (used)", cost.model],
      ["Recommended model", recommendation.model.model],
      ["Recommended effort", recommendation.effort.effort],
    ])
    .addHeading("Suggestions", 3)
    .addRaw(suggestionLines + "\n")
    .write();

  core.info(`ctok: input tokens: ${estimate.input.expected} | cost: $${cost.totalUsd.toFixed(4)} | model: ${recommendation.model.model}`);

  // threshold checks run after summary so results are always visible
  if (maxTokens !== undefined && estimate.input.expected > maxTokens) {
    core.setFailed(
      `ctok: input token count ${estimate.input.expected} exceeds max-tokens threshold of ${maxTokens}.`,
    );
    return;
  }

  if (maxCost !== undefined && cost.totalUsd > maxCost) {
    core.setFailed(
      `ctok: estimated cost $${cost.totalUsd.toFixed(4)} exceeds max-cost-usd threshold of $${maxCost}.`,
    );
    return;
  }
}

run().catch((err: unknown) => {
  core.setFailed(`ctok action failed: ${err instanceof Error ? err.message : String(err)}`);
});
