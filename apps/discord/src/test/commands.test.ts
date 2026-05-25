import { describe, it, expect } from "vitest";
import { analyze } from "@ctok/core";
import { refine } from "@ctok/refiner";
import { fmtTokens, fmtUsd, effortEmoji, buildCheckEmbed, buildRefineEmbed, buildHelpEmbed, buildErrorEmbed } from "../format";
import type { CheckResult, RefineOutput } from "../types";

// format helpers

describe("fmtTokens", () => {
  it("formats small numbers as-is", () => expect(fmtTokens(500)).toBe("500"));
  it("formats thousands with k", () => expect(fmtTokens(1_500)).toBe("1.5k"));
  it("formats millions with M", () => expect(fmtTokens(1_500_000)).toBe("1.5M"));
});

describe("fmtUsd", () => {
  it("formats small values to 4dp", () => expect(fmtUsd(0.001)).toBe("$0.0010"));
  it("formats normal values to 2dp", () => expect(fmtUsd(1.5)).toBe("$1.50"));
});

describe("effortEmoji", () => {
  it("returns correct emoji per effort level", () => {
    expect(effortEmoji("low")).toBe("🟢");
    expect(effortEmoji("medium")).toBe("🟡");
    expect(effortEmoji("high")).toBe("🟠");
    expect(effortEmoji("xhigh")).toBe("🔴");
    expect(effortEmoji("unknown")).toBe("⚪");
  });
});

// embed builders

describe("buildCheckEmbed", () => {
  function makeCheckResult(): CheckResult {
    const result = analyze({ prompt: "Fix the login bug", files: [], taskType: "bug-fix" });
    return {
      estimate: result.estimate,
      recommendation: result.recommendation,
      suggestions: result.suggestions,
      cost: result.cost,
    };
  }

  it("returns an EmbedBuilder with a title", () => {
    const embed = buildCheckEmbed(makeCheckResult());
    const data = embed.toJSON();
    expect(data.title).toContain("Token Estimate");
  });

  it("includes input tokens field", () => {
    const embed = buildCheckEmbed(makeCheckResult());
    const data = embed.toJSON();
    const fields = data.fields ?? [];
    expect(fields.some((f) => f.name === "Input tokens")).toBe(true);
  });

  it("includes recommendation field", () => {
    const embed = buildCheckEmbed(makeCheckResult());
    const data = embed.toJSON();
    const fields = data.fields ?? [];
    expect(fields.some((f) => f.name === "Recommendation")).toBe(true);
  });

  it("has non-null color", () => {
    const embed = buildCheckEmbed(makeCheckResult());
    expect(embed.toJSON().color).toBeDefined();
  });
});

describe("buildRefineEmbed", () => {
  it("returns embed with tokens saved field", () => {
    const result = refine({ prompt: "Please kindly help me to fix the authentication bug" });
    const output: RefineOutput = {
      refined: result.refined,
      tokensSaved: result.savedTokens,
      savedPct: result.savedPct,
    };
    const embed = buildRefineEmbed(output);
    const data = embed.toJSON();
    expect(data.title).toContain("Refined");
    const fields = data.fields ?? [];
    expect(fields.some((f) => f.name === "Tokens saved")).toBe(true);
  });
});

describe("buildHelpEmbed", () => {
  it("lists all four commands", () => {
    const embed = buildHelpEmbed();
    const json = JSON.stringify(embed.toJSON());
    expect(json).toContain("check");
    expect(json).toContain("refine");
    expect(json).toContain("scan");
    expect(json).toContain("help");
  });
});

describe("buildErrorEmbed", () => {
  it("shows the error message", () => {
    const embed = buildErrorEmbed("ctok not found on PATH");
    const data = embed.toJSON();
    expect(data.description).toContain("ctok not found");
  });
});

// analyze integration

describe("analyze integration", () => {
  it("returns positive token counts for a real prompt", () => {
    const result = analyze({ prompt: "Refactor the auth module to use JWT", files: [], taskType: "refactor" });
    expect(result.estimate.input.expected).toBeGreaterThan(0);
    expect(result.cost.totalUsd).toBeGreaterThanOrEqual(0);
    expect(result.recommendation.effort.effort).toMatch(/^(low|medium|high|xhigh)$/);
  });

  it("longer prompts produce more tokens", () => {
    const short = analyze({ prompt: "Fix bug", files: [], taskType: "general" });
    const long = analyze({ prompt: "x ".repeat(3000), files: [], taskType: "general" });
    expect(long.estimate.input.expected).toBeGreaterThan(short.estimate.input.expected);
  });
});
