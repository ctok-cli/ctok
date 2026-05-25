import * as fs from "node:fs";
import { analyze } from "@ctok/core";
import { CtokError } from "../error";
import type { EstimatorInput } from "@ctok/core";
import { header, kvTable, c, printJson } from "../output/format";
import { trackEvent } from "../telemetry";

export interface ModelOptions {
  file?: string;
  json?: boolean;
  quiet?: boolean;
}

export async function runModel(promptArg: string | undefined, opts: ModelOptions): Promise<void> {
  let promptText: string;
  if (opts.file) {
    promptText = fs.readFileSync(opts.file, "utf8").trim();
  } else if (promptArg) {
    promptText = promptArg.trim();
  } else {
    throw new CtokError(
      "E_NO_PROMPT",
      "No prompt provided.",
      'Usage: ctok model "<prompt>" | ctok model -f prompt.md',
    );
  }

  trackEvent("model", { json: !!opts.json });
  const input: EstimatorInput = { prompt: promptText, files: [], taskType: "general" };
  const result = analyze(input);
  const { recommendation, cost } = result;

  if (opts.json) {
    printJson({ recommendation, cost });
    return;
  }

  if (opts.quiet) {
    process.stdout.write(`${recommendation.model.model} ${recommendation.effort.effort}\n`);
    return;
  }

  process.stdout.write(header("Model recommendation") + "\n");
  process.stdout.write(
    kvTable([
      ["Model", c.ok(recommendation.model.model)],
      ["Effort", c.ok(recommendation.effort.effort)],
      ["Why (model)", recommendation.model.reason],
      ["Why (effort)", recommendation.effort.reason],
    ]) + "\n",
  );

  // Show all model options
  process.stdout.write(header("All options") + "\n");
  for (const opt of recommendation.model.alternatives ?? []) {
    process.stdout.write(`  ${c.dim("○")} ${opt.model}  ${c.dim(opt.reason)}\n`);
  }
  if (!(recommendation.model.alternatives?.length)) {
    process.stdout.write(`  ${c.dim("(no alternatives listed)")}\n`);
  }
  process.stdout.write("\n");
}
