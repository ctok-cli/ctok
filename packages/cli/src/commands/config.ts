import * as child_process from "node:child_process";
import * as os from "node:os";
import * as path from "node:path";
import { PLANS, detectPlan, readCtokConfig, writeCtokConfig, savePlanConfig, type PlanId } from "@ctok/quota";
import { header, kvTable, colTable, c } from "../output/format";
import { isOptedIn } from "../telemetry";

const VALID_PLANS = Object.keys(PLANS);

export function runConfigShow(): void {
  const plan = detectPlan();
  const ctokHome = process.env["CTOK_HOME"] ?? path.join(os.homedir(), ".ctok");
  process.stdout.write(header("ctok configuration") + "\n");
  process.stdout.write(
    kvTable([
      ["Config dir", ctokHome],
      ["Plan", `${c.bold(plan.planId)}  ${c.dim(`(source: ${plan.confidence})`)}`],
      ["Plan note", PLANS[plan.planId].limitNote],
      ["Telemetry", isOptedIn() ? c.ok("enabled") : c.dim("disabled (default)")],
    ]) + "\n",
  );

  process.stdout.write(header("Available plans") + "\n");
  const rows = Object.values(PLANS).map((p) => [
    p.id === plan.planId ? c.ok(p.id) : p.id,
    p.label,
    p.monthlyUsd !== null ? `$${p.monthlyUsd}/mo` : "custom",
  ]);
  process.stdout.write(colTable(["ID", "Label", "Price"], rows) + "\n");
  process.stdout.write(
    `  Set your plan: ${c.brand("ctok config set plan <id>")}\n\n`,
  );
}

export function runConfigSet(key: string, value: string): void {
  if (key === "plan") {
    if (!VALID_PLANS.includes(value)) {
      process.stderr.write(
        `Unknown plan: "${value}". Valid: ${VALID_PLANS.join(", ")}\n`,
      );
      process.exit(1);
    }
    savePlanConfig(value as PlanId);
    process.stdout.write(c.ok(`Plan set to "${value}".\n`));
    return;
  }
  if (key === "telemetry") {
    if (value !== "true" && value !== "false") {
      process.stderr.write(`Invalid value for telemetry: "${value}". Use true or false.\n`);
      process.exit(1);
    }
    writeCtokConfig("telemetry", value === "true");
    process.stdout.write(
      value === "true"
        ? c.ok("Telemetry enabled. Anonymous usage events will be sent to Plausible.\n")
        : c.ok("Telemetry disabled. No data will be sent.\n"),
    );
    return;
  }
  writeCtokConfig(key, value);
  process.stdout.write(c.ok(`Config key "${key}" set to "${value}".\n`));
}

export function runConfigGet(key: string): void {
  if (key === "plan") {
    const plan = detectPlan();
    process.stdout.write(`${plan.planId}  ${c.dim(`(${plan.confidence})`)}\n`);
    return;
  }
  const val = readCtokConfig(key);
  if (val === undefined) {
    process.stderr.write(`Key not found: "${key}"\n`);
    process.exit(1);
  }
  process.stdout.write(`${String(val)}\n`);
}

export function runConfigEdit(): void {
  const ctokHome = process.env["CTOK_HOME"] ?? path.join(os.homedir(), ".ctok");
  const configPath = path.join(ctokHome, "config.json");
  const editor = process.env["EDITOR"] ?? process.env["VISUAL"] ?? (process.platform === "win32" ? "notepad" : "nano");
  process.stdout.write(`Opening ${configPath} in ${editor}...\n`);
  child_process.spawnSync(editor, [configPath], { stdio: "inherit" });
}
