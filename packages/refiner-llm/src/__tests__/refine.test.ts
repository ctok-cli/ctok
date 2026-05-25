import { describe, it, expect, vi, beforeEach } from "vitest";
import { approxTokens } from "../tokenCount";
import { SYSTEM_PROMPT } from "../prompt";

// approxTokens

describe("approxTokens", () => {
  it("returns 0 for empty string", () => {
    expect(approxTokens("")).toBe(0);
  });

  it("estimates ~1 token per 4 chars", () => {
    expect(approxTokens("aaaa")).toBe(1);
    expect(approxTokens("a".repeat(100))).toBe(25);
  });

  it("rounds up", () => {
    expect(approxTokens("abc")).toBe(1); // ceil(3/4)
    expect(approxTokens("abcde")).toBe(2); // ceil(5/4)
  });

  it("longer text gives more tokens", () => {
    expect(approxTokens("x ".repeat(100))).toBeGreaterThan(approxTokens("x ".repeat(10)));
  });
});

// SYSTEM_PROMPT

describe("SYSTEM_PROMPT", () => {
  it("is a non-empty string", () => {
    expect(typeof SYSTEM_PROMPT).toBe("string");
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it("instructs to output only the refined prompt", () => {
    expect(SYSTEM_PROMPT).toContain("Output ONLY the refined prompt");
  });

  it("mentions filler phrase removal", () => {
    expect(SYSTEM_PROMPT.toLowerCase()).toContain("filler");
  });

  it("mentions redundancy removal", () => {
    expect(SYSTEM_PROMPT.toLowerCase()).toContain("redundan");
  });
});

// refineLlm (mocked)

describe("refineLlm", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws when no API key is set", async () => {
    // Ensure env var is not set
    const savedKey = process.env["ANTHROPIC_API_KEY"];
    delete process.env["ANTHROPIC_API_KEY"];

    const { refineLlm } = await import("../refine");
    await expect(refineLlm("Fix the bug")).rejects.toThrow("API key required");

    if (savedKey !== undefined) process.env["ANTHROPIC_API_KEY"] = savedKey;
  }, 15_000); // AI SDK module load under concurrent test runners can be slow

  it("uses haiku-4-5 as default model", async () => {
    // Mock the ai module so we don't make real API calls
    vi.doMock("ai", () => ({
      generateText: vi.fn().mockResolvedValue({
        text: "Fix the bug.",
        usage: { promptTokens: 50, completionTokens: 10 },
      }),
    }));
    vi.doMock("@ai-sdk/anthropic", () => ({
      createAnthropic: vi.fn(() => (modelId: string) => ({ modelId })),
    }));

    const { refineLlm } = await import("../refine");
    const result = await refineLlm("Please kindly help me to fix the bug", { apiKey: "sk-test" });

    expect(result.model).toBe("claude-haiku-4-5");
    expect(result.refined).toBe("Fix the bug.");
  });

  it("calculates savedTokens and savedPct correctly", async () => {
    vi.doMock("ai", () => ({
      generateText: vi.fn().mockResolvedValue({
        text: "Short.", // much shorter than input
        usage: { promptTokens: 100, completionTokens: 5 },
      }),
    }));
    vi.doMock("@ai-sdk/anthropic", () => ({
      createAnthropic: vi.fn(() => () => ({})),
    }));

    const { refineLlm } = await import("../refine");
    const longPrompt = "x ".repeat(200); // 400 chars → 100 approxTokens
    const result = await refineLlm(longPrompt, { apiKey: "sk-test" });

    expect(result.savedTokens).toBeGreaterThan(0);
    expect(result.savedPct).toBeGreaterThan(0);
    expect(result.savedPct).toBeLessThanOrEqual(100);
    expect(result.refineCallInputTokens).toBe(100);
    expect(result.refineCallOutputTokens).toBe(5);
  });

  it("accepts model override", async () => {
    vi.doMock("ai", () => ({
      generateText: vi.fn().mockResolvedValue({
        text: "Refactored.",
        usage: { promptTokens: 30, completionTokens: 5 },
      }),
    }));
    vi.doMock("@ai-sdk/anthropic", () => ({
      createAnthropic: vi.fn(() => () => ({})),
    }));

    const { refineLlm } = await import("../refine");
    const result = await refineLlm("Please refactor this module", {
      apiKey: "sk-test",
      model: "claude-sonnet-4-6",
    });

    expect(result.model).toBe("claude-sonnet-4-6");
  });
});
