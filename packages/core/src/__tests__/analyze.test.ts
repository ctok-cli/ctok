import { describe, it, expect } from "vitest";
import { analyze } from "../analyze";
import type { EstimatorInput } from "../types";

// Helpers
function makeInput(overrides: Partial<EstimatorInput> = {}): EstimatorInput {
  return {
    prompt: "",
    files: [],
    taskType: "general",
    ...overrides,
  };
}

// Scenario 1: Tiny rename, one small file

const TINY_FILE_CONTENT = `export function getUser(id: string) { return db.find(id); }
export function listUsers() { return db.findAll(); }`;

describe("Scenario 1 - tiny rename, one file", () => {
  const result = analyze(
    makeInput({
      prompt: "Rename getUser to fetchUser everywhere in this file.",
      taskType: "bug-fix",
      files: [
        {
          id: "f1",
          name: "users.ts",
          content: TINY_FILE_CONTENT,
          bytes: TINY_FILE_CONTENT.length,
        },
      ],
    }),
  );

  it("recommends haiku", () => {
    expect(result.recommendation.model.model).toBe("haiku-4-5");
  });

  it("recommends low effort", () => {
    expect(result.recommendation.effort.effort).toBe("low");
  });

  it("complexity band is simple", () => {
    expect(result.recommendation.complexity.band).toBe("simple");
  });

  it("total tokens are small", () => {
    expect(result.estimate.input.expected).toBeLessThan(500);
  });

  it("produces no suggestions", () => {
    expect(result.suggestions).toHaveLength(0);
  });

  it("cost is pennies", () => {
    expect(result.cost.totalUsd).toBeLessThan(0.01);
  });
});

// Scenario 2: Standard feature
// Use compact but realistic TypeScript so files are small enough (~500 chars
// each) to stay in the "normal" complexity band.

const CONTROLLER = `import { Request, Response } from 'express';
import { OrdersService } from './orders.service';
export class OrdersController {
  constructor(private svc: OrdersService) {}
  async list(req: Request, res: Response) {
    const orders = await this.svc.findAll();
    res.json(orders);
  }
}`;

const SERVICE = `import { db } from '../db';
export class OrdersService {
  async findAll() { return db.orders.findMany(); }
  async findById(id: string) { return db.orders.findUnique({ where: { id } }); }
}`;

describe("Scenario 2 - standard feature", () => {
  const result = analyze(
    makeInput({
      prompt:
        "Add pagination to the /orders endpoint, page + per_page query params, max 100.",
      taskType: "feature",
      files: [
        { id: "f1", name: "orders.controller.ts", content: CONTROLLER, bytes: CONTROLLER.length },
        { id: "f2", name: "orders.service.ts",    content: SERVICE,    bytes: SERVICE.length },
      ],
    }),
  );

  it("recommends sonnet", () => {
    expect(result.recommendation.model.model).toBe("sonnet-4-6");
  });

  it("recommends medium effort", () => {
    expect(result.recommendation.effort.effort).toBe("medium");
  });

  it("complexity band is normal", () => {
    expect(result.recommendation.complexity.band).toBe("normal");
  });
});

// Scenario 3: Architecture decision

describe("Scenario 3 - architecture decision", () => {
  const result = analyze(
    makeInput({
      prompt:
        "Evaluate moving session storage from Redis to Postgres. Consider concurrency, migration story, cost.",
      taskType: "architecture",
    }),
  );

  it("recommends opus", () => {
    expect(result.recommendation.model.model).toBe("opus-4-7");
  });

  it("recommends xhigh effort", () => {
    expect(result.recommendation.effort.effort).toBe("xhigh");
  });

  it("complexity band is deep", () => {
    expect(result.recommendation.complexity.band).toBe("deep");
  });
});

// Scenario 4: Debugging with a huge log file

describe("Scenario 4 - debugging with huge log", () => {
  // Build a realistic-looking log: timestamps + ERROR/INFO lines
  const logLine = "2024-01-15T08:32:11 ERROR Worker crashed at startup at run(worker.js:42:10)\n";
  const hugeLog = logLine.repeat(400); // ~400 lines ≈ 30k+ tokens

  const result = analyze(
    makeInput({
      prompt: "Why is the worker crashing on startup?",
      taskType: "debugging",
      files: [
        { id: "f1", name: "worker.log", content: hugeLog, bytes: hugeLog.length },
      ],
    }),
  );

  it("flags a log file suggestion", () => {
    const logSug = result.suggestions.find((s) => s.title.includes("Log files"));
    expect(logSug).toBeDefined();
  });

  it("log suggestion saves the majority of tokens", () => {
    const logSug = result.suggestions.find((s) => s.title.includes("Log files"));
    expect(logSug!.estimatedSavingTokens).toBeGreaterThan(1000);
  });

  it("log suggestion is a warning", () => {
    const logSug = result.suggestions.find((s) => s.title.includes("Log files"));
    expect(logSug!.severity).toBe("warn");
  });
});

// Scenario 5: Reviewing a massive PR diff

describe("Scenario 5 - massive PR diff review", () => {
  // Build a realistic diff: headers + lines
  const diffHeader = "--- a/api.ts\n+++ b/api.ts\n@@ -1,10 +1,10 @@\n";
  const diffBody = "+export function newThing() { return 42; }\n-export function oldThing() { return 1; }\n".repeat(300);
  const diff = diffHeader + diffBody;

  const result = analyze(
    makeInput({
      prompt: "Review this PR for correctness.",
      taskType: "review",
      files: [
        { id: "f1", name: "pr.diff", content: diff, bytes: diff.length },
      ],
    }),
  );

  it("flags large diff suggestion", () => {
    const diffSug = result.suggestions.find((s) => s.title.includes("diff"));
    expect(diffSug).toBeDefined();
  });

  it("recommends sonnet or better for normal-band task", () => {
    expect(["sonnet-4-6", "opus-4-7"]).toContain(result.recommendation.model.model);
  });
});

// analyze() shape contract

describe("analyze() output shape", () => {
  const result = analyze(makeInput({ prompt: "hello", taskType: "general" }));

  it("returns estimate with input/output/chunks", () => {
    expect(result.estimate.input.expected).toBeGreaterThan(0);
    expect(result.estimate.output.expected).toBeGreaterThan(0);
    expect(Array.isArray(result.estimate.chunks)).toBe(true);
  });

  it("returns cost in USD", () => {
    expect(result.cost.totalUsd).toBeGreaterThanOrEqual(0);
    expect(result.cost.totalUsdRange.min).toBeLessThanOrEqual(result.cost.totalUsdRange.max);
  });

  it("respects modelOverride", () => {
    const r = analyze(makeInput({ prompt: "hello" }), "haiku-4-5");
    expect(r.cost.model).toBe("haiku-4-5");
  });
});
