import * as os from "node:os";
import * as fs from "node:fs";
import * as path from "node:path";
import { detectPlan, PLANS } from "@ctok/quota";
import { c, kvTable, header } from "../output/format";
import { isOptedIn } from "../telemetry";

function check(label: string, pass: boolean, detail?: string): void {
  const icon = pass ? c.ok("✓") : c.danger("✗");
  const msg = detail ? `${pass ? c.ok(label) : c.danger(label)}  ${c.dim(detail)}` : (pass ? c.ok(label) : c.danger(label));
  process.stdout.write(`  ${icon}  ${msg}\n`);
}

export function runDoctor(): void {
  process.stdout.write(header("ctok doctor") + "\n\n");

  // Node.js version
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.slice(1).split(".")[0], 10);
  check(
    `Node.js ${nodeVersion}`,
    nodeMajor >= 18,
    nodeMajor < 18 ? "ctok requires Node.js 18 or later" : undefined,
  );

  // Platform
  const platform = process.platform;
  check(`Platform: ${platform} ${os.arch()}`, true);

  // ctok home
  const ctokHome = process.env["CTOK_HOME"] ?? path.join(os.homedir(), ".ctok");
  const ctokHomeExists = fs.existsSync(ctokHome);
  check(
    `ctok home: ${ctokHome}`,
    ctokHomeExists,
    ctokHomeExists ? undefined : "Not yet created — will be on first run",
  );

  // Config file
  const configPath = path.join(ctokHome, "config.json");
  const configExists = fs.existsSync(configPath);
  check(
    `Config: ${configPath}`,
    configExists,
    configExists ? undefined : "No config yet — run `ctok config set plan <id>`",
  );

  // Plan detection
  const plan = detectPlan();
  const planValid = plan.planId in PLANS;
  check(
    `Plan: ${plan.planId}  (${plan.confidence})`,
    planValid,
    plan.confidence === "default"
      ? "Using default. Run `ctok config set plan <id>` to set your plan."
      : plan.source,
  );

  // Claude home
  const claudeHome = process.env["CLAUDE_HOME"] ?? path.join(os.homedir(), ".claude");
  const claudeHomeExists = fs.existsSync(claudeHome);
  check(
    `Claude home: ${claudeHome}`,
    claudeHomeExists,
    claudeHomeExists ? "Found — plan auto-detection may work" : "Not found — install Claude Code for auto-detection",
  );

  // Claude settings.json
  if (claudeHomeExists) {
    const settingsPath = path.join(claudeHome, "settings.json");
    const settingsExist = fs.existsSync(settingsPath);
    check(
      `Claude settings.json`,
      settingsExist,
      settingsExist ? undefined : "Not found (normal if not using Claude Code)",
    );
  }

  // History file
  const historyPath = path.join(ctokHome, "history.json");
  const historyExists = fs.existsSync(historyPath);
  if (historyExists) {
    try {
      const entries = JSON.parse(fs.readFileSync(historyPath, "utf8"));
      check(`History: ${Array.isArray(entries) ? entries.length : "?"} entries`, true);
    } catch {
      check("History: unreadable", false, "Run `ctok history --clear` to reset");
    }
  } else {
    check("History: none yet", true);
  }

  // Telemetry
  const telemetryOn = isOptedIn();
  check(
    `Telemetry: ${telemetryOn ? "enabled" : "disabled"}`,
    true,
    telemetryOn
      ? "Anonymous usage events sent to Plausible. Disable: ctok config set telemetry false"
      : "No data sent. Enable: ctok config set telemetry true",
  );

  process.stdout.write("\n");
  process.stdout.write(
    kvTable([
      ["Version", "0.1.0"],
      ["Packages", "@ctok/core @ctok/scanner @ctok/refiner @ctok/quota"],
    ]) + "\n",
  );
}
