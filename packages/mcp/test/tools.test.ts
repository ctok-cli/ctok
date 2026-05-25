import { describe, it, expect } from "vitest";
import { runEstimate, estimateTool } from "../src/tools/estimate";
import { runRefine, refineTool } from "../src/tools/refine";
import { runRecommendModel, recommendModelTool } from "../src/tools/recommend_model";
import { runScanProject, scanProjectTool } from "../src/tools/scan_project";
import path from "node:path";

// tool schema shape

describe("tool schemas", () => {
  it("estimate schema has required prompt field", () => {
    expect(estimateTool.inputSchema.required).toContain("prompt");
    expect(estimateTool.inputSchema.properties.taskType.enum).toContain("refactor");
  });

  it("refine schema has required prompt field", () => {
    expect(refineTool.inputSchema.required).toContain("prompt");
  });

  it("recommend_model schema has required prompt field", () => {
    expect(recommendModelTool.inputSchema.required).toContain("prompt");
  });

  it("scan_project schema has no required fields (path is optional)", () => {
    expect(scanProjectTool.inputSchema.required).toBeUndefined();
  });
});

// estimate

describe("runEstimate", () => {
  it("returns token ranges and recommendation for a simple prompt", () => {
    const result = runEstimate({
      prompt: "Refactor the auth middleware to use the new session store",
      taskType: "refactor",
    });

    expect(result.tokens.input.expected).toBeGreaterThan(0);
    expect(result.tokens.output.expected).toBeGreaterThan(0);
    expect(result.tokens.confidence).toMatch(/^(high|medium|low)$/);
    expect(result.cost.totalUsd).toBeGreaterThan(0);
    expect(["haiku-4-5", "sonnet-4-6", "opus-4-7"]).toContain(result.recommendation.model);
    expect(["low", "medium", "high", "xhigh"]).toContain(result.recommendation.effort);
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it("defaults taskType to general for unknown values", () => {
    const result = runEstimate({ prompt: "Hello world", taskType: "not-a-real-type" });
    expect(result.tokens.input.expected).toBeGreaterThan(0);
  });

  it("handles pastedCode and projectContext", () => {
    const result = runEstimate({
      prompt: "Fix the bug in this function",
      pastedCode: "function add(a, b) { return a - b; }",
      projectContext: "TypeScript codebase, uses Jest",
    });
    expect(result.tokens.input.expected).toBeGreaterThan(0);
  });
});

// refine

describe("runRefine", () => {
  it("returns refined prompt and specificity score", () => {
    const result = runRefine({
      prompt: "Please could you kindly help me to improve and handle the auth thing somehow",
    });
    expect(result.original).toContain("Please");
    expect(typeof result.refined).toBe("string");
    expect(result.specificityScore).toBeGreaterThanOrEqual(0);
    expect(result.specificityScore).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.passes)).toBe(true);
    expect(result.passes.length).toBe(7);
  });

  it("saves tokens on a filler-heavy prompt", () => {
    const result = runRefine({
      prompt: "Please can you kindly please just basically make sure to really ensure that you definitely handle the error very carefully and also please make sure to not forget to add logging too",
    });
    expect(result.savedTokens).toBeGreaterThan(0);
  });

  it("accepts optional context", () => {
    const result = runRefine({
      prompt: "Refactor this code",
      context: "TypeScript Express API",
    });
    expect(typeof result.refined).toBe("string");
  });
});

// recommend_model

describe("runRecommendModel", () => {
  it("returns model, effort, and complexity for a prompt", () => {
    const result = runRecommendModel({
      prompt: "Fix the typo in the README",
      taskType: "bug-fix",
    });
    expect(["haiku-4-5", "sonnet-4-6", "opus-4-7"]).toContain(result.model);
    expect(["low", "medium", "high", "xhigh"]).toContain(result.effort);
    expect(["simple", "normal", "deep"]).toContain(result.complexity.band);
    expect(typeof result.modelReason).toBe("string");
    expect(typeof result.effortReason).toBe("string");
    expect(Array.isArray(result.alternatives)).toBe(true);
  });

  it("recommends a lighter model for a trivial task", () => {
    const result = runRecommendModel({
      prompt: "Fix the typo on line 3",
      taskType: "bug-fix",
    });
    expect(["haiku-4-5", "sonnet-4-6"]).toContain(result.model);
  });

  it("recommends a heavier model for architecture tasks", () => {
    const result = runRecommendModel({
      prompt: "Design a distributed event sourcing system for a multi-tenant SaaS platform with CQRS, saga orchestration, and cross-region replication",
      taskType: "architecture",
    });
    expect(["sonnet-4-6", "opus-4-7"]).toContain(result.model);
  });
});

// scan_project

describe("runScanProject", () => {
  it("scans the monorepo root and returns project metrics", async () => {
    const root = path.resolve(__dirname, "../../../");
    const result = await runScanProject({ path: root });

    expect(result.root).toBe(root);
    expect(result.totalFiles).toBeGreaterThan(0);
    expect(result.estimatedTokens).toBeGreaterThan(0);
    expect(typeof result.projectType).toBe("string");
    expect(typeof result.byExtension).toBe("object");
    expect(Array.isArray(result.topHeavyFiles)).toBe(true);
  });

  it("defaults to cwd when no path given", async () => {
    const result = await runScanProject({});
    expect(typeof result.root).toBe("string");
    expect(result.totalFiles).toBeGreaterThanOrEqual(0);
  });

  it("respects topHeavyCount", async () => {
    const root = path.resolve(__dirname, "../../../");
    const result = await runScanProject({ path: root, topHeavyCount: 3 });
    expect(result.topHeavyFiles.length).toBeLessThanOrEqual(3);
  });
});
