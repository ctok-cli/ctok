import { describe, it, expect } from "vitest";
import { analyze } from "@ctok/core";
import { refine } from "@ctok/refiner";

describe("browser-ext core integration (smoke)", () => {
  it("analyze returns a token count for a non-empty prompt", () => {
    const result = analyze({
      prompt: "Refactor the auth module to use JWT tokens",
      pastedCode: "",
      projectContext: "",
      files: [],
      taskType: "general",
    });
    expect(result.estimate.input.expected).toBeGreaterThan(0);
    expect(result.cost.totalUsd).toBeGreaterThanOrEqual(0);
  });

  it("analyze handles empty prompt without throwing", () => {
    const result = analyze({
      prompt: "",
      pastedCode: "",
      projectContext: "",
      files: [],
      taskType: "general",
    });
    expect(result.estimate.input.expected).toBeGreaterThanOrEqual(0);
  });

  it("refine returns a refined version for a verbose prompt", () => {
    const result = refine({
      prompt: "please can you kindly help me to handle the auth thing somehow if possible",
    });
    expect(result.refined.length).toBeLessThanOrEqual(result.original.length);
    expect(result.specificityScore).toBeGreaterThanOrEqual(0);
    expect(result.specificityScore).toBeLessThanOrEqual(100);
  });

  it("refine reports passes array", () => {
    const result = refine({ prompt: "Implement user login feature please" });
    expect(Array.isArray(result.passes)).toBe(true);
  });
});

describe("site config (host detection)", () => {
  it("getSiteConfig returns null for unknown host", async () => {
    Object.defineProperty(window, "location", {
      value: { hostname: "example.com" },
      writable: true,
    });
    const { getSiteConfig } = await import("../sites");
    expect(getSiteConfig()).toBeNull();
  });

  it("getSiteConfig returns config for claude.ai", async () => {
    Object.defineProperty(window, "location", {
      value: { hostname: "claude.ai" },
      writable: true,
    });
    const { getSiteConfig } = await import("../sites");
    const config = getSiteConfig();
    expect(config).not.toBeNull();
    expect(config?.label).toBe("Claude");
  });
});
