import { describe, it, expect } from "vitest";
import { runAnalysis, runRefine } from "../utils/analysis";
import { fmtTokens, fmtUsd, fmtPct, effortEmoji, confidenceBadge } from "../utils/format";

describe("runAnalysis", () => {
  const SHORT = "Fix the login bug.";
  const LONG = "x ".repeat(5_000);

  it("returns estimate with expected tokens > 0", () => {
    const { result } = runAnalysis(SHORT);
    expect(result.estimate.input.expected).toBeGreaterThan(0);
    expect(result.estimate.output.expected).toBeGreaterThan(0);
  });

  it("returns recommendation with effort and model", () => {
    const { result } = runAnalysis(SHORT);
    expect(result.recommendation.effort.effort).toMatch(/^(low|medium|high|xhigh)$/);
    expect(result.recommendation.model.model).toBeTruthy();
  });

  it("contextPct is a ratio between 0 and 1", () => {
    const { contextPct } = runAnalysis(SHORT);
    expect(contextPct).toBeGreaterThanOrEqual(0);
    expect(contextPct).toBeLessThanOrEqual(1);
  });

  it("longer prompt → more tokens", () => {
    const short = runAnalysis(SHORT);
    const long = runAnalysis(LONG);
    expect(long.result.estimate.input.expected).toBeGreaterThan(short.result.estimate.input.expected);
  });

  it("quota is null when no plan provided", () => {
    const { quota } = runAnalysis(SHORT, {});
    expect(quota).toBeNull();
  });

  it("quota is non-null for known plan", () => {
    const { quota } = runAnalysis(SHORT, { plan: "pro" });
    expect(quota).not.toBeNull();
    expect(quota?.percentOf5hWindow).toBeDefined();
  });

  it("quota is null for api plan", () => {
    const { quota } = runAnalysis(SHORT, { plan: "api" });
    expect(quota).toBeNull();
  });

  it("accepts taskType override", () => {
    const { result } = runAnalysis(SHORT, { taskType: "bug-fix" });
    expect(result.recommendation.effort.effort).toMatch(/^(low|medium|high|xhigh)$/);
  });

  it("estimate has confidence field", () => {
    const { result } = runAnalysis(SHORT);
    expect(result.estimate.confidence).toMatch(/^(high|medium|low)$/);
  });

  it("cost fields are non-negative", () => {
    const { result } = runAnalysis(SHORT);
    expect(result.cost.totalUsd).toBeGreaterThanOrEqual(0);
    expect(result.cost.inputUsd).toBeGreaterThanOrEqual(0);
    expect(result.cost.outputUsd).toBeGreaterThanOrEqual(0);
  });

  it("cost has totalUsdRange", () => {
    const { result } = runAnalysis(SHORT);
    expect(result.cost.totalUsdRange.min).toBeGreaterThanOrEqual(0);
    expect(result.cost.totalUsdRange.max).toBeGreaterThanOrEqual(result.cost.totalUsdRange.min);
  });
});

describe("runRefine", () => {
  it("returns a refined string and tokensSaved", () => {
    const { refined, tokensSaved } = runRefine("Please kindly help me to fix the authentication bug in the login module.");
    expect(typeof refined).toBe("string");
    expect(refined.length).toBeGreaterThan(0);
    expect(typeof tokensSaved).toBe("number");
    expect(tokensSaved).toBeGreaterThanOrEqual(0);
  });
});

describe("fmtTokens", () => {
  it("formats small numbers as-is", () => {
    expect(fmtTokens(500)).toBe("500");
  });

  it("formats thousands with k suffix", () => {
    expect(fmtTokens(1_500)).toBe("1.5k");
    expect(fmtTokens(10_000)).toBe("10.0k");
  });

  it("formats millions with M suffix", () => {
    expect(fmtTokens(1_500_000)).toBe("1.5M");
  });
});

describe("fmtUsd", () => {
  it("formats small values to 4 decimal places", () => {
    expect(fmtUsd(0.001)).toBe("$0.0010");
  });

  it("formats normal values to 2 decimal places", () => {
    expect(fmtUsd(1.5)).toBe("$1.50");
    expect(fmtUsd(0.01)).toBe("$0.01");
  });
});

describe("fmtPct", () => {
  it("formats ratio as percentage with 1 decimal", () => {
    expect(fmtPct(0.5)).toBe("50.0%");
    expect(fmtPct(0.123)).toBe("12.3%");
  });
});

describe("effortEmoji", () => {
  it("returns emoji for each effort level", () => {
    expect(effortEmoji("low")).toBe("🟢");
    expect(effortEmoji("medium")).toBe("🟡");
    expect(effortEmoji("high")).toBe("🟠");
    expect(effortEmoji("xhigh")).toBe("🔴");
    expect(effortEmoji("unknown")).toBe("⚪");
  });
});

describe("confidenceBadge", () => {
  it("returns badge text for each level", () => {
    expect(confidenceBadge("high")).toBe("High ✓");
    expect(confidenceBadge("medium")).toBe("Medium ~");
    expect(confidenceBadge("low")).toBe("Low ?");
    expect(confidenceBadge("other")).toBe("other");
  });
});
