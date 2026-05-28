#!/usr/bin/env node
import { Command } from "commander";
import { runCheck } from "./commands/check";
import { runScan } from "./commands/scan";
import { runRefine } from "./commands/refine";
import { runModel } from "./commands/model";
import { runHistory, runDiff } from "./commands/history";
import { runConfigShow, runConfigSet, runConfigGet, runConfigEdit } from "./commands/config";
import { runInit } from "./commands/init";
import { runDoctor } from "./commands/doctor";
import { runServe } from "./commands/serve";
import { runRepl } from "./repl";
import { fatal } from "./error";

const program = new Command();

program
  .name("ctok")
  .description("Lighthouse for Claude prompts - estimate tokens, recommend models, refine prompts")
  .version("0.1.0")
  .option("--no-color", "Disable colour output")
  .option("--debug", "Print internals and full stack traces on error")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts["noColor"]) {
      process.env["NO_COLOR"] = "1";
      process.env["FORCE_COLOR"] = "0";
    }
    if (opts["debug"]) {
      process.env["CTOK_DEBUG"] = "1";
    }
  });

program
  .command("check [prompt]")
  .description('Estimate tokens for a prompt. Use "-" to read from stdin.')
  .option("-f, --file <path>", "Read prompt from file")
  .option("-m, --model <id>", "Override model for cost calculation")
  .option(
    "-t, --task-type <type>",
    "Task type: bug-fix | feature | refactor | debugging | review | documentation | architecture | general",
    "general",
  )
  .option("--json", "Output JSON")
  .option("-q, --quiet", "Minimal output")
  .option("--no-save", "Do not save to history")
  .action(async (prompt, opts) => {
    await runCheck(prompt, opts);
  });

program
  .command("scan [root]")
  .description("Scan a project directory and show token distribution")
  .option("--json", "Output JSON")
  .option("-q, --quiet", "Minimal output")
  .option("--top <n>", "Number of heavy files to show", (v) => parseInt(v, 10), 10)
  .action(async (root, opts) => {
    await runScan({ root, json: opts.json, quiet: opts.quiet, topN: opts.top });
  });

program
  .command("refine [prompt]")
  .description("Refine a prompt to reduce tokens and improve clarity")
  .option("-f, --file <path>", "Read prompt from file")
  .option("-i, --interactive", "Accept/reject each suggestion interactively")
  .option("--auto", "Auto-apply all suggestions")
  .option("--json", "Output JSON")
  .option("-q, --quiet", "Print only the refined prompt")
  .option("--llm", "Use Claude LLM for semantic refinement (requires ANTHROPIC_API_KEY)")
  .option("--llm-model <model>", "Model for LLM refine (haiku-4-5 | sonnet-4-6 | opus-4-7)")
  .option("--api-key <key>", "Anthropic API key (overrides ANTHROPIC_API_KEY env var)")
  .option("--diff", "Show side-by-side colored diff with before/after specificity score")
  .action(async (prompt, opts) => {
    await runRefine(prompt, opts);
  });

program
  .command("model [prompt]")
  .description("Recommend the best model + effort level for a prompt")
  .option("-f, --file <path>", "Read prompt from file")
  .option("--json", "Output JSON")
  .option("-q, --quiet", "Print model and effort only")
  .action(async (prompt, opts) => {
    await runModel(prompt, opts);
  });

program
  .command("history")
  .description("Show recent token estimations")
  .option("-n, --limit <n>", "Number of entries to show", (v) => parseInt(v, 10), 20)
  .option("--csv", "Output CSV")
  .option("--json", "Output JSON")
  .option("--clear", "Clear history")
  .action((opts) => {
    runHistory(opts);
  });

program
  .command("diff <id1> <id2>")
  .description("Compare two history entries")
  .option("--json", "Output JSON")
  .action((id1, id2, opts) => {
    runDiff(id1, id2, opts);
  });

const configCmd = program
  .command("config")
  .description("View or edit ctok configuration")
  .action(() => runConfigShow());

configCmd
  .command("set <key> <value>")
  .description("Set a config value (e.g. ctok config set plan max20x)")
  .action((key, value) => runConfigSet(key, value));

configCmd
  .command("get <key>")
  .description("Get a config value")
  .action((key) => runConfigGet(key));

configCmd
  .command("edit")
  .description("Open config file in $EDITOR")
  .action(() => runConfigEdit());

program
  .command("serve")
  .description("Launch the local web UI (ctok playground) on localhost")
  .option("-p, --port <port>", "Port to listen on", (v) => parseInt(v, 10), 31337)
  .action((opts) => runServe({ port: opts.port }));

program
  .command("init")
  .description("Generate .ctokignore and CLAUDE.md template in the current directory")
  .option("--force", "Overwrite existing files")
  .action((opts) => runInit(opts));

program
  .command("doctor")
  .description("Diagnose ctok installation and configuration")
  .action(() => runDoctor());

program.action(async () => {
  await runRepl();
});

process.on("unhandledRejection", (reason) => {
  fatal(reason, process.env["CTOK_DEBUG"] === "1");
});

program.parseAsync().catch((err) => {
  fatal(err, process.env["CTOK_DEBUG"] === "1");
});
