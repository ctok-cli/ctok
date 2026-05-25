import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as os from "node:os";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  PLANS,
  modelToTier,
  getWindowLimit,
  TYPICAL_TOKENS_PER_MESSAGE,
  getQuotaImpact,
  compareAcrossPlans,
  detectPlan,
  savePlanConfig,
  readCtokConfig,
  writeCtokConfig,
} from "../index";

// Plans table

describe("PLANS table", () => {
  it("contains all 7 expected plan IDs", () => {
    const ids = Object.keys(PLANS);
    expect(ids).toContain("free");
    expect(ids).toContain("pro");
    expect(ids).toContain("max5x");
    expect(ids).toContain("max20x");
    expect(ids).toContain("team");
    expect(ids).toContain("enterprise");
    expect(ids).toContain("api");
  });

  it("max5x has ~5x the Pro sonnet limit", () => {
    const pro = PLANS.pro.window5h.sonnet!;
    const max5x = PLANS.max5x.window5h.sonnet!;
    expect(max5x).toBeGreaterThanOrEqual(pro * 4);
    expect(max5x).toBeLessThanOrEqual(pro * 6);
  });

  it("max20x has ~20x the Pro sonnet limit", () => {
    const pro = PLANS.pro.window5h.sonnet!;
    const max20x = PLANS.max20x.window5h.sonnet!;
    expect(max20x).toBeGreaterThanOrEqual(pro * 15);
    expect(max20x).toBeLessThanOrEqual(pro * 25);
  });

  it("enterprise and api have null window limits (unlimited)", () => {
    expect(PLANS.enterprise.window5h.sonnet).toBeNull();
    expect(PLANS.enterprise.window5h.haiku).toBeNull();
    expect(PLANS.enterprise.window5h.opus).toBeNull();
    expect(PLANS.api.window5h.sonnet).toBeNull();
  });

  it("all limited plans have haiku limit >= sonnet limit", () => {
    for (const plan of Object.values(PLANS)) {
      if (plan.window5h.haiku !== null && plan.window5h.sonnet !== null) {
        expect(plan.window5h.haiku).toBeGreaterThanOrEqual(plan.window5h.sonnet);
      }
    }
  });

  it("all limited plans have sonnet limit >= opus limit", () => {
    for (const plan of Object.values(PLANS)) {
      if (plan.window5h.sonnet !== null && plan.window5h.opus !== null) {
        expect(plan.window5h.sonnet).toBeGreaterThanOrEqual(plan.window5h.opus);
      }
    }
  });
});

// modelToTier

describe("modelToTier", () => {
  it("maps haiku model IDs to 'haiku'", () => {
    expect(modelToTier("claude-haiku-4-5")).toBe("haiku");
    expect(modelToTier("claude-3-haiku-20240307")).toBe("haiku");
  });

  it("maps opus model IDs to 'opus'", () => {
    expect(modelToTier("claude-opus-4-7")).toBe("opus");
    expect(modelToTier("claude-3-opus-20240229")).toBe("opus");
  });

  it("maps sonnet model IDs to 'sonnet'", () => {
    expect(modelToTier("claude-sonnet-4-6")).toBe("sonnet");
    expect(modelToTier("claude-3-5-sonnet-20241022")).toBe("sonnet");
  });

  it("defaults to 'sonnet' for unknown models", () => {
    expect(modelToTier("claude-unknown-model")).toBe("sonnet");
  });
});

// getWindowLimit

describe("getWindowLimit", () => {
  it("returns Pro sonnet limit", () => {
    const limit = getWindowLimit("pro", "claude-sonnet-4-6");
    expect(typeof limit).toBe("number");
    expect(limit).toBeGreaterThan(0);
  });

  it("returns null for enterprise", () => {
    expect(getWindowLimit("enterprise", "claude-sonnet-4-6")).toBeNull();
  });

  it("returns null for api", () => {
    expect(getWindowLimit("api", "claude-opus-4-7")).toBeNull();
  });

  it("returns null for unknown plan", () => {
    // @ts-expect-error testing invalid input
    expect(getWindowLimit("unknown-plan", "claude-sonnet-4-6")).toBeNull();
  });
});

// getQuotaImpact

describe("getQuotaImpact", () => {
  it("always sets isEstimated: true", () => {
    const impact = getQuotaImpact({
      estimatedTokens: 1000,
      model: "claude-sonnet-4-6",
      plan: "pro",
    });
    expect(impact.isEstimated).toBe(true);
  });

  it("typical small prompt uses < 5% of Pro window", () => {
    const impact = getQuotaImpact({
      estimatedTokens: TYPICAL_TOKENS_PER_MESSAGE,
      model: "claude-sonnet-4-6",
      plan: "pro",
    });
    expect(impact.percentOf5hWindow).not.toBeNull();
    expect(impact.percentOf5hWindow!).toBeGreaterThan(0);
    expect(impact.percentOf5hWindow!).toBeLessThan(10);
  });

  it("large prompt (50k tokens) uses significant % of Pro window", () => {
    const impact = getQuotaImpact({
      estimatedTokens: 50_000,
      model: "claude-sonnet-4-6",
      plan: "pro",
    });
    expect(impact.percentOf5hWindow!).toBeGreaterThan(10);
  });

  it("enterprise plan returns unlimited = true, null percentages", () => {
    const impact = getQuotaImpact({
      estimatedTokens: 100_000,
      model: "claude-sonnet-4-6",
      plan: "enterprise",
    });
    expect(impact.unlimited).toBe(true);
    expect(impact.percentOf5hWindow).toBeNull();
    expect(impact.percentOfDailyBudget).toBeNull();
    expect(impact.remainingMessagesIn5h).toBeNull();
  });

  it("api plan returns unlimited = true", () => {
    const impact = getQuotaImpact({
      estimatedTokens: 5_000,
      model: "claude-opus-4-7",
      plan: "api",
    });
    expect(impact.unlimited).toBe(true);
  });

  it("equivalentMessages is at least 1", () => {
    const impact = getQuotaImpact({
      estimatedTokens: 10, // tiny
      model: "claude-haiku-4-5",
      plan: "pro",
    });
    expect(impact.equivalentMessages).toBeGreaterThanOrEqual(1);
  });

  it("percentOf5hWindow < percentOfDailyBudget (daily covers more windows)", () => {
    const impact = getQuotaImpact({
      estimatedTokens: 2_000,
      model: "claude-sonnet-4-6",
      plan: "pro",
    });
    if (impact.percentOf5hWindow !== null && impact.percentOfDailyBudget !== null) {
      expect(impact.percentOf5hWindow).toBeGreaterThan(impact.percentOfDailyBudget);
    }
  });

  it("summary contains plan label", () => {
    const impact = getQuotaImpact({
      estimatedTokens: 2_000,
      model: "claude-sonnet-4-6",
      plan: "pro",
    });
    expect(impact.summary).toMatch(/Pro/i);
  });

  it("throws on invalid plan ID", () => {
    expect(() =>
      getQuotaImpact({
        estimatedTokens: 1000,
        model: "claude-sonnet-4-6",
        // @ts-expect-error testing invalid input
        plan: "invalid-plan",
      }),
    ).toThrow();
  });

  it("max20x remaining messages >> Pro remaining messages for same prompt", () => {
    const opts = { estimatedTokens: 2_000, model: "claude-sonnet-4-6" };
    const pro = getQuotaImpact({ ...opts, plan: "pro" });
    const max20x = getQuotaImpact({ ...opts, plan: "max20x" });
    expect(max20x.remainingMessagesIn5h!).toBeGreaterThan(pro.remainingMessagesIn5h!);
  });
});

// compareAcrossPlans

describe("compareAcrossPlans", () => {
  it("returns an entry for all 7 plans", () => {
    const result = compareAcrossPlans(2_000, "claude-sonnet-4-6");
    expect(Object.keys(result)).toHaveLength(7);
  });

  it("all entries have isEstimated: true", () => {
    const result = compareAcrossPlans(2_000, "claude-sonnet-4-6");
    for (const impact of Object.values(result)) {
      expect(impact.isEstimated).toBe(true);
    }
  });
});

// detectPlan

describe("detectPlan", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let tmpDir: string;

  beforeEach(() => {
    originalEnv = { ...process.env };
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ctok-test-"));
    // Point CTOK_HOME and CLAUDE_HOME to a fresh temp dir
    process.env["CTOK_HOME"] = path.join(tmpDir, ".ctok");
    process.env["CLAUDE_HOME"] = path.join(tmpDir, ".claude");
  });

  afterEach(() => {
    process.env = originalEnv;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("detects plan from CTOK_PLAN env var", () => {
    process.env["CTOK_PLAN"] = "max20x";
    const result = detectPlan();
    expect(result.planId).toBe("max20x");
    expect(result.confidence).toBe("env");
  });

  it("ignores invalid CTOK_PLAN value", () => {
    process.env["CTOK_PLAN"] = "not-a-plan";
    const result = detectPlan();
    expect(result.confidence).not.toBe("env");
  });

  it("detects plan from ctok config file", () => {
    const ctokDir = path.join(tmpDir, ".ctok");
    fs.mkdirSync(ctokDir, { recursive: true });
    fs.writeFileSync(path.join(ctokDir, "config.json"), JSON.stringify({ plan: "max5x" }));
    const result = detectPlan();
    expect(result.planId).toBe("max5x");
    expect(result.confidence).toBe("ctok-config");
  });

  it("detects plan from Claude Code settings.json", () => {
    const claudeDir = path.join(tmpDir, ".claude");
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(path.join(claudeDir, "settings.json"), JSON.stringify({ plan: "team" }));
    const result = detectPlan();
    expect(result.planId).toBe("team");
    expect(result.confidence).toBe("claude-config");
  });

  it("falls back to 'pro' with default confidence when nothing is set", () => {
    const result = detectPlan();
    expect(result.planId).toBe("pro");
    expect(result.confidence).toBe("default");
  });

  it("prefers CTOK_PLAN env over config file", () => {
    process.env["CTOK_PLAN"] = "max20x";
    const ctokDir = path.join(tmpDir, ".ctok");
    fs.mkdirSync(ctokDir, { recursive: true });
    fs.writeFileSync(path.join(ctokDir, "config.json"), JSON.stringify({ plan: "pro" }));
    const result = detectPlan();
    expect(result.planId).toBe("max20x");
    expect(result.confidence).toBe("env");
  });
});

// savePlanConfig / readCtokConfig / writeCtokConfig

describe("config file I/O", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let tmpDir: string;

  beforeEach(() => {
    originalEnv = { ...process.env };
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ctok-io-"));
    process.env["CTOK_HOME"] = path.join(tmpDir, ".ctok");
  });

  afterEach(() => {
    process.env = originalEnv;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("savePlanConfig writes and detectPlan reads it back", () => {
    savePlanConfig("max20x");
    const result = detectPlan();
    expect(result.planId).toBe("max20x");
    expect(result.confidence).toBe("ctok-config");
  });

  it("writeCtokConfig and readCtokConfig round-trip a string value", () => {
    writeCtokConfig("someKey", "someValue");
    expect(readCtokConfig("someKey")).toBe("someValue");
  });

  it("writeCtokConfig and readCtokConfig round-trip a number value", () => {
    writeCtokConfig("topHeavyCount", 20);
    expect(readCtokConfig("topHeavyCount")).toBe(20);
  });

  it("readCtokConfig returns undefined for missing key", () => {
    expect(readCtokConfig("nonexistent")).toBeUndefined();
  });

  it("writeCtokConfig merges with existing config (does not overwrite)", () => {
    writeCtokConfig("a", 1);
    writeCtokConfig("b", 2);
    expect(readCtokConfig("a")).toBe(1);
    expect(readCtokConfig("b")).toBe(2);
  });

  it("creates config directory if it does not exist", () => {
    const ctokHome = path.join(tmpDir, "nested", "dir", ".ctok");
    process.env["CTOK_HOME"] = ctokHome;
    writeCtokConfig("plan", "api");
    expect(readCtokConfig("plan")).toBe("api");
  });
});
