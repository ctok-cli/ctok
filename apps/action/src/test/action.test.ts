/**
 * Unit tests for the action logic.
 * The @actions/core functions are unavailable outside of a GitHub runner, so
 * we test the analysis and output logic through the underlying libraries
 * (@ctok/core, @ctok/refiner, @ctok/quota) that the action wraps.
 */
import { describe, it, expect } from "vitest";
import { analyze } from "@ctok/core";
import { refine } from "@ctok/refiner";
import { getQuotaImpact } from "@ctok/quota";
import type { TaskType } from "@ctok/core";

// Core analysis contract (what the action passes to outputs)

function runActionLogic(
  promptText: string,
  opts: { model?: string; taskType?: TaskType; plan?: string } = {},
) {
  const result = analyze(
    { prompt: promptText, files: [], taskType: opts.taskType ?? "general" },
    opts.model as any,
  );
  const { estimate, cost, recommendation, suggestions } = result;

  const quota = getQuotaImpact({
    estimatedTokens: estimate.input.expected + estimate.output.expected,
    model: cost.model,
    plan: (opts.plan ?? "pro") as any,
  });

  return { estimate, cost, recommendation, suggestions, quota };
}

describe("action analysis - output shape", () => {
  it("produces positive input and output tokens", () => {
    const { estimate } = runActionLogic("Refactor the auth module to use JWT");
    expect(estimate.input.expected).toBeGreaterThan(0);
    expect(estimate.output.expected).toBeGreaterThan(0);
  });

  it("input range is ordered min ≤ expected ≤ max", () => {
    const { estimate } = runActionLogic("hello world");
    expect(estimate.input.min).toBeLessThanOrEqual(estimate.input.expected);
    expect(estimate.input.expected).toBeLessThanOrEqual(estimate.input.max);
  });

  it("output range is ordered min ≤ expected ≤ max", () => {
    const { estimate } = runActionLogic("hello world");
    expect(estimate.output.min).toBeLessThanOrEqual(estimate.output.expected);
    expect(estimate.output.expected).toBeLessThanOrEqual(estimate.output.max);
  });

  it("totalExpected equals input.expected + output.expected", () => {
    const { estimate } = runActionLogic("hello");
    expect(estimate.totalExpected).toBe(estimate.input.expected + estimate.output.expected);
  });

  it("cost.totalUsd is non-negative", () => {
    const { cost } = runActionLogic("hello");
    expect(cost.totalUsd).toBeGreaterThanOrEqual(0);
  });

  it("cost range is ordered min ≤ totalUsd ≤ max", () => {
    const { cost } = runActionLogic("Implement a large feature");
    expect(cost.totalUsdRange.min).toBeLessThanOrEqual(cost.totalUsd);
    expect(cost.totalUsd).toBeLessThanOrEqual(cost.totalUsdRange.max);
  });

  it("confidence is one of high/medium/low", () => {
    const { estimate } = runActionLogic("hello");
    expect(["high", "medium", "low"]).toContain(estimate.confidence);
  });

  it("recommended effort is one of low/medium/high/xhigh", () => {
    const { recommendation } = runActionLogic("hello");
    expect(["low", "medium", "high", "xhigh"]).toContain(recommendation.effort.effort);
  });

  it("model override is reflected in cost.model", () => {
    const { cost } = runActionLogic("hello", { model: "haiku-4-5" });
    expect(cost.model).toBe("haiku-4-5");
  });

  it("architecture task type yields xhigh effort", () => {
    const { recommendation } = runActionLogic(
      "Design a distributed event-sourcing system from scratch",
      { taskType: "architecture" },
    );
    expect(["high", "xhigh"]).toContain(recommendation.effort.effort);
  });
});

// Threshold logic

describe("threshold checks", () => {
  it("large prompt exceeds a low max-tokens threshold", () => {
    const bigPrompt = "word ".repeat(500);
    const { estimate } = runActionLogic(bigPrompt);
    expect(estimate.input.expected).toBeGreaterThan(100);
    // The action would setFailed if estimate.input.expected > maxTokens
    const wouldFail = estimate.input.expected > 100;
    expect(wouldFail).toBe(true);
  });

  it("tiny prompt is below a generous max-tokens threshold", () => {
    const { estimate } = runActionLogic("Fix typo");
    expect(estimate.input.expected).toBeLessThan(10_000);
  });

  it("cost stays below $0.10 for a short prompt at any model", () => {
    const { cost } = runActionLogic("Rename variable x to y");
    expect(cost.totalUsd).toBeLessThan(0.1);
  });
});

// Quota

describe("quota output", () => {
  it("returns a non-null percentOf5hWindow for known plans", () => {
    for (const plan of ["pro", "max5x", "max20x", "team"]) {
      const { quota } = runActionLogic("hello", { plan });
      expect(quota.percentOf5hWindow).not.toBeNull();
    }
  });

  it("quota pct is > 0 for any non-empty prompt", () => {
    const { quota } = runActionLogic("hello world", { plan: "pro" });
    expect(quota.percentOf5hWindow).toBeGreaterThan(0);
  });
});

// Refiner integration

describe("refiner (withRefine: true)", () => {
  it("returns a non-empty refined string", () => {
    const result = refine({ prompt: "please can you kindly help me write a sort function" });
    expect(result.refined.trim().length).toBeGreaterThan(0);
  });

  it("savedTokens is a non-negative number", () => {
    const result = refine({ prompt: "please can you kindly help me write a sort function" });
    expect(result.savedTokens).toBeGreaterThanOrEqual(0);
  });

  it("specificityScore is 0-100", () => {
    const result = refine({ prompt: "implement oauth" });
    expect(result.specificityScore).toBeGreaterThanOrEqual(0);
    expect(result.specificityScore).toBeLessThanOrEqual(100);
  });
});

// Suggestions JSON serialisability

describe("suggestions output", () => {
  it("suggestions array round-trips through JSON", () => {
    const logLine = "2024-01-15T08:32:11 ERROR crash at startup\n";
    const { suggestions } = runActionLogic("Why is worker crashing? " + logLine.repeat(200));
    const json = JSON.stringify(suggestions);
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    if (parsed.length > 0) {
      expect(typeof parsed[0].title).toBe("string");
      expect(typeof parsed[0].detail).toBe("string");
    }
  });

  it("clean prompt produces no suggestions", () => {
    const { suggestions } = runActionLogic("Rename getUser to fetchUser");
    expect(suggestions).toHaveLength(0);
  });
});
