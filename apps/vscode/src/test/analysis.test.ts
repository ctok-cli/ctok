import { describe, it, expect } from "vitest";
import { runAnalysis, fmtTokens, fmtUsd, fmtPct } from "../analysis";

// runAnalysis

describe("runAnalysis", () => {
  it("returns a result with estimate, cost, recommendation", () => {
    const { result } = runAnalysis("Rename getUser to fetchUser in the auth module", {});
    expect(result.estimate.input.expected).toBeGreaterThan(0);
    expect(result.cost.totalUsd).toBeGreaterThanOrEqual(0);
    expect(result.recommendation.model.model).toBeTruthy();
  });

  it("respects model override", () => {
    const { result } = runAnalysis("hello", { model: "haiku-4-5" });
    expect(result.cost.model).toBe("haiku-4-5");
  });

  it("respects taskType override", () => {
    // architecture taskType should push toward higher effort
    const { result } = runAnalysis(
      "Evaluate moving from monolith to microservices",
      { taskType: "architecture" },
    );
    expect(["high", "xhigh"]).toContain(result.recommendation.effort.effort);
  });

  it("returns quotaPct for pro plan", () => {
    const { quotaPct } = runAnalysis("hello world", { plan: "pro" });
    expect(typeof quotaPct).toBe("number");
    expect(quotaPct).toBeGreaterThan(0);
  });

  it("includes refineResult when withRefine: true", () => {
    const { refineResult } = runAnalysis(
      "please can you kindly help me to write a sort function",
      { withRefine: true },
    );
    expect(refineResult).toBeDefined();
    expect(typeof refineResult!.refined).toBe("string");
    expect(typeof refineResult!.specificityScore).toBe("number");
  });

  it("refineResult is undefined when withRefine is omitted", () => {
    const { refineResult } = runAnalysis("hello", {});
    expect(refineResult).toBeUndefined();
  });
});

// format helpers

describe("fmtTokens", () => {
  it("returns plain number for < 1000", () => {
    expect(fmtTokens(500)).toBe("500");
  });
  it("uses k suffix for thousands", () => {
    expect(fmtTokens(1500)).toBe("1.5k");
  });
  it("uses M suffix for millions", () => {
    expect(fmtTokens(2_000_000)).toBe("2.0M");
  });
});

describe("fmtUsd", () => {
  it("shows < $0.001 for tiny amounts", () => {
    expect(fmtUsd(0.0001)).toBe("< $0.001");
  });
  it("shows 4dp for sub-cent", () => {
    expect(fmtUsd(0.005)).toMatch(/^\$0\.005/);
  });
  it("shows 3dp for normal amounts", () => {
    expect(fmtUsd(0.25)).toBe("$0.250");
  });
});

describe("fmtPct", () => {
  it("formats to 1dp with percent sign", () => {
    expect(fmtPct(0.123)).toBe("12.3%");
  });
  it("handles 100%", () => {
    expect(fmtPct(1)).toBe("100.0%");
  });
});
