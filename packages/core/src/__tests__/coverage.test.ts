/**
 * Supplementary tests that bring coverage up to the ≥85% threshold.
 * Each describe block targets a specific file that was under-covered.
 */
import { describe, it, expect } from "vitest";
import { formatNumber, formatUsd, uid, clamp, truncate } from "../utils";
import { buildSuggestions } from "../reducer/suggestions";
import { recommendModel, modelLabel } from "../recommender/model";
import type { EstimatorInput, TokenEstimate } from "../types";

// utils.ts

describe("formatNumber", () => {
  it("returns — for non-finite values", () => {
    expect(formatNumber(Infinity)).toBe("—");
    expect(formatNumber(NaN)).toBe("—");
  });
  it("formats millions", () => {
    expect(formatNumber(1_500_000)).toBe("1.50M");
    expect(formatNumber(2_000_000)).toBe("2.00M");
  });
  it("formats thousands ≥10k without decimal", () => {
    expect(formatNumber(12_000)).toBe("12k");
  });
  it("formats thousands <10k with one decimal", () => {
    expect(formatNumber(1_500)).toBe("1.5k");
  });
  it("formats small numbers as integers", () => {
    expect(formatNumber(42)).toBe("42");
    expect(formatNumber(999)).toBe("999");
  });
  it("handles negative millions", () => {
    expect(formatNumber(-2_000_000)).toBe("-2.00M");
  });
});

describe("formatUsd", () => {
  it("returns — for non-finite values", () => {
    expect(formatUsd(Infinity)).toBe("—");
    expect(formatUsd(NaN)).toBe("—");
  });
  it("returns <$0.01 for tiny amounts", () => {
    expect(formatUsd(0.001)).toBe("<$0.01");
    expect(formatUsd(0)).toBe("<$0.01");
  });
  it("formats sub-dollar amounts with 3 decimals", () => {
    expect(formatUsd(0.05)).toBe("$0.050");
    expect(formatUsd(0.999)).toBe("$0.999");
  });
  it("formats normal dollar amounts with 2 decimals", () => {
    expect(formatUsd(1.5)).toBe("$1.50");
    expect(formatUsd(99.99)).toBe("$99.99");
  });
  it("formats large amounts with no decimals", () => {
    expect(formatUsd(100)).toBe("$100");
    expect(formatUsd(1234.56)).toBe("$1235");
  });
});

describe("uid", () => {
  it("returns a string", () => {
    expect(typeof uid()).toBe("string");
  });
  it("respects prefix", () => {
    expect(uid("sug").startsWith("sug_")).toBe(true);
  });
  it("default prefix is id", () => {
    expect(uid().startsWith("id_")).toBe(true);
  });
  it("generates unique values", () => {
    expect(uid()).not.toBe(uid());
  });
});

describe("clamp", () => {
  it("clamps below lo", () => expect(clamp(-5, 0, 10)).toBe(0));
  it("clamps above hi", () => expect(clamp(15, 0, 10)).toBe(10));
  it("returns value within range", () => expect(clamp(5, 0, 10)).toBe(5));
});

describe("truncate", () => {
  it("returns short strings unchanged", () => {
    expect(truncate("hello")).toBe("hello");
  });
  it("truncates long strings and appends ellipsis", () => {
    const long = "a".repeat(200);
    const result = truncate(long, 120);
    expect(result.length).toBe(120);
    expect(result.endsWith("…")).toBe(true);
  });
  it("respects custom n", () => {
    expect(truncate("abcdef", 4)).toBe("abc…");
  });
});

// reducer/suggestions.ts

function makeEstimate(chunks: TokenEstimate["chunks"] = []): TokenEstimate {
  const total = chunks.reduce((s, c) => s + c.tokens, 0) + 10;
  return {
    input: { min: total, expected: total, max: total },
    output: { min: 100, expected: 200, max: 400 },
    chunks,
  };
}

function makeInput(overrides: Partial<EstimatorInput> = {}): EstimatorInput {
  return { prompt: "Fix the bug", files: [], taskType: "general", ...overrides };
}

describe("buildSuggestions — huge file", () => {
  it("flags a file with ≥20k tokens as danger", () => {
    const chunks = [{ label: "bigfile.ts", tokens: 25_000, kind: "code" as const }];
    const sugs = buildSuggestions(makeInput(), makeEstimate(chunks));
    const sug = sugs.find((s) => s.title.includes("Huge file"));
    expect(sug).toBeDefined();
    expect(sug!.severity).toBe("danger");
  });
});

describe("buildSuggestions — long file", () => {
  it("flags a file with ≥6k tokens as warn", () => {
    const chunks = [{ label: "service.ts", tokens: 8_000, kind: "code" as const }];
    const sugs = buildSuggestions(makeInput(), makeEstimate(chunks));
    const sug = sugs.find((s) => s.title.includes("Long file"));
    expect(sug).toBeDefined();
    expect(sug!.severity).toBe("warn");
  });
  it("does not flag prompt/pasted code/project context labels", () => {
    const chunks = [{ label: "prompt", tokens: 10_000, kind: "code" as const }];
    const sugs = buildSuggestions(makeInput(), makeEstimate(chunks));
    expect(sugs.find((s) => s.title.includes("Long file"))).toBeUndefined();
  });
});

describe("buildSuggestions — log files", () => {
  it("flags log chunks", () => {
    const chunks = [{ label: "app.log", tokens: 5_000, kind: "log" as const }];
    const sugs = buildSuggestions(makeInput(), makeEstimate(chunks));
    expect(sugs.find((s) => s.title.includes("Log files"))).toBeDefined();
  });
});

describe("buildSuggestions — minified content", () => {
  it("flags minified chunks as danger", () => {
    const chunks = [{ label: "bundle.min.js", tokens: 3_000, kind: "minified" as const }];
    const sugs = buildSuggestions(makeInput(), makeEstimate(chunks));
    const sug = sugs.find((s) => s.title.includes("Minified"));
    expect(sug).toBeDefined();
    expect(sug!.severity).toBe("danger");
  });
});

describe("buildSuggestions — large diff", () => {
  it("flags diff chunks >3k tokens", () => {
    const chunks = [{ label: "pr.diff", tokens: 4_000, kind: "diff" as const }];
    const sugs = buildSuggestions(makeInput(), makeEstimate(chunks));
    expect(sugs.find((s) => s.title.includes("diff"))).toBeDefined();
  });
  it("does not flag small diffs", () => {
    const chunks = [{ label: "small.diff", tokens: 1_000, kind: "diff" as const }];
    const sugs = buildSuggestions(makeInput(), makeEstimate(chunks));
    expect(sugs.find((s) => s.title.includes("diff"))).toBeUndefined();
  });
});

describe("buildSuggestions — duplicate content", () => {
  it("flags near-identical files", () => {
    const content = "x".repeat(300);
    const input = makeInput({
      files: [
        { id: "a", name: "fileA.ts", content, bytes: content.length },
        { id: "b", name: "fileB.ts", content, bytes: content.length },
      ],
    });
    const sugs = buildSuggestions(input, makeEstimate());
    expect(sugs.find((s) => s.title.includes("duplicate"))).toBeDefined();
  });
});

describe("buildSuggestions — filler-heavy prompt", () => {
  it("flags long prompts with many filler phrases", () => {
    const filler = "Please make sure to very really remember that please be sure to ".repeat(80);
    const input = makeInput({ prompt: filler });
    const sugs = buildSuggestions(input, makeEstimate());
    expect(sugs.find((s) => s.title.includes("filler"))).toBeDefined();
  });
  it("ignores short prompts even with fillers", () => {
    const input = makeInput({ prompt: "Please fix it" });
    const sugs = buildSuggestions(input, makeEstimate());
    expect(sugs.find((s) => s.title.includes("filler"))).toBeUndefined();
  });
});

describe("buildSuggestions — many files", () => {
  it("flags ≥8 attached files", () => {
    const files = Array.from({ length: 8 }, (_, i) => ({
      id: `f${i}`,
      name: `file${i}.ts`,
      content: "x",
      bytes: 1,
    }));
    const sugs = buildSuggestions(makeInput({ files }), makeEstimate());
    expect(sugs.find((s) => s.title.includes("files attached"))).toBeDefined();
  });
});

describe("buildSuggestions — heavy project context", () => {
  it("flags project context chunk >8k tokens", () => {
    const chunks = [{ label: "project context", tokens: 9_000, kind: "code" as const }];
    const sugs = buildSuggestions(makeInput(), makeEstimate(chunks));
    expect(sugs.find((s) => s.title.includes("Heavy project context"))).toBeDefined();
  });
});

describe("buildSuggestions — approaching context window", () => {
  it("flags input >180k tokens", () => {
    const estimate: TokenEstimate = {
      input: { min: 180_001, expected: 185_000, max: 190_000 },
      output: { min: 100, expected: 200, max: 400 },
      chunks: [],
    };
    const sugs = buildSuggestions(makeInput(), estimate);
    expect(sugs.find((s) => s.title.includes("context limits"))).toBeDefined();
  });
});

// recommender/model.ts

describe("recommendModel", () => {
  const simpleComplexity = { band: "simple" as const, score: 10, factors: [] };
  const normalComplexity = { band: "normal" as const, score: 50, factors: [] };
  const deepComplexity   = { band: "deep"   as const, score: 90, factors: [] };

  it("recommends haiku for simple tasks", () => {
    const r = recommendModel(simpleComplexity, "bug-fix", 100);
    expect(r.model).toBe("haiku-4-5");
  });

  it("recommends sonnet for normal tasks", () => {
    const r = recommendModel(normalComplexity, "feature", 1_000);
    expect(r.model).toBe("sonnet-4-6");
  });

  it("recommends opus for deep tasks", () => {
    const r = recommendModel(deepComplexity, "architecture", 5_000);
    expect(r.model).toBe("opus-4-7");
  });

  it("adds haiku alt for documentation tasks when not already haiku", () => {
    const r = recommendModel(normalComplexity, "documentation", 1_000);
    const altModels = r.alternatives.map((a) => a.model);
    expect(altModels).toContain("haiku-4-5");
  });

  it("appends large-context note when input >150k and primary is not opus", () => {
    const r = recommendModel(normalComplexity, "feature", 160_000);
    expect(r.reason).toContain("150k tokens");
  });

  it("does not append large-context note when primary is already opus", () => {
    const r = recommendModel(deepComplexity, "architecture", 160_000);
    expect(r.reason).not.toContain("150k tokens");
  });
});

describe("modelLabel", () => {
  it("returns a non-empty string for each model", () => {
    for (const model of ["haiku-4-5", "sonnet-4-6", "opus-4-7"] as const) {
      expect(typeof modelLabel(model)).toBe("string");
      expect(modelLabel(model).length).toBeGreaterThan(0);
    }
  });
});
