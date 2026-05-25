import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { PlanId } from "./plans";

/**
 * Attempt to detect the user's Claude plan from local config files.
 *
 * Detection strategy (tried in order):
 *  1. CTOK_PLAN env var (user-set override)
 *  2. ~/.claude/settings.json   — Claude Code config
 *  3. ~/.ctok/config.json       — ctok's own config (written by `ctok config set plan`)
 *  4. Fall back to "pro" (most common paid plan) with a warning
 *
 * Returns both the detected plan and the confidence level so callers can
 * decide whether to show the "configure your plan" prompt.
 */

export type DetectionConfidence = "env" | "claude-config" | "ctok-config" | "default";

export interface DetectionResult {
  planId: PlanId;
  confidence: DetectionConfidence;
  /** Human-readable explanation of how the plan was determined */
  source: string;
}

const VALID_PLAN_IDS = new Set<string>([
  "free", "pro", "max5x", "max20x", "team", "enterprise", "api",
]);

function isValidPlanId(v: unknown): v is PlanId {
  return typeof v === "string" && VALID_PLAN_IDS.has(v);
}

/** Read a JSON file safely; returns null on any error. */
function readJsonFile(filePath: string): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

/** Resolve the Claude home directory (~/.claude or CLAUDE_HOME env). */
function getClaudeHome(): string {
  return process.env["CLAUDE_HOME"] ?? path.join(os.homedir(), ".claude");
}

/** Resolve ctok's own config directory (~/.ctok). */
function getCtokHome(): string {
  return process.env["CTOK_HOME"] ?? path.join(os.homedir(), ".ctok");
}

export function detectPlan(): DetectionResult {
  // 1. Explicit env override
  const envPlan = process.env["CTOK_PLAN"];
  if (isValidPlanId(envPlan)) {
    return {
      planId: envPlan,
      confidence: "env",
      source: `CTOK_PLAN environment variable = "${envPlan}"`,
    };
  }

  // 2. Claude Code settings.json
  const claudeSettings = readJsonFile(path.join(getClaudeHome(), "settings.json"));
  if (claudeSettings) {
    // Claude Code may store plan info under various keys
    const candidates = [claudeSettings["plan"], claudeSettings["subscriptionPlan"]];
    for (const candidate of candidates) {
      if (isValidPlanId(candidate)) {
        return {
          planId: candidate,
          confidence: "claude-config",
          source: `~/.claude/settings.json (plan = "${candidate}")`,
        };
      }
    }
  }

  // 3. ctok own config
  const ctokConfig = readJsonFile(path.join(getCtokHome(), "config.json"));
  if (ctokConfig) {
    const candidate = ctokConfig["plan"];
    if (isValidPlanId(candidate)) {
      return {
        planId: candidate,
        confidence: "ctok-config",
        source: `~/.ctok/config.json (plan = "${candidate}")`,
      };
    }
  }

  // 4. Default
  return {
    planId: "pro",
    confidence: "default",
    source:
      "No plan configured — defaulting to Pro. " +
      "Run `ctok config set plan <id>` to set your actual plan.",
  };
}

/** Write the plan to ctok's config file. Creates the directory if needed. */
export function savePlanConfig(planId: PlanId): void {
  const configDir = getCtokHome();
  fs.mkdirSync(configDir, { recursive: true });
  const configPath = path.join(configDir, "config.json");
  const existing = readJsonFile(configPath) ?? {};
  const updated = { ...existing, plan: planId };
  fs.writeFileSync(configPath, JSON.stringify(updated, null, 2) + "\n", "utf8");
}

/** Read ctok config value by key. */
export function readCtokConfig(key: string): unknown {
  const configPath = path.join(getCtokHome(), "config.json");
  const config = readJsonFile(configPath);
  return config ? config[key] : undefined;
}

/** Write a single key to ctok config. */
export function writeCtokConfig(key: string, value: unknown): void {
  const configDir = getCtokHome();
  fs.mkdirSync(configDir, { recursive: true });
  const configPath = path.join(configDir, "config.json");
  const existing = readJsonFile(configPath) ?? {};
  const updated = { ...existing, [key]: value };
  fs.writeFileSync(configPath, JSON.stringify(updated, null, 2) + "\n", "utf8");
}
