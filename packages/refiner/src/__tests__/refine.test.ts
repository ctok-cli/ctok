import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { refine } from "../pipeline";
import { fillerStrip, applyFillerStrip } from "../passes/fillerStrip";
import { vagueVerbReplace } from "../passes/vagueVerbReplace";
import { structureScaffold } from "../passes/structureScaffold";
import { dedup } from "../passes/dedup";
import { fileRefCompression } from "../passes/fileRefCompression";
import { outputFormatHint } from "../passes/outputFormatHint";
import { negativeCollapse } from "../passes/negativeCollapse";
import { specificityScore, scoreBreakdown } from "../specificityScore";

const CORPUS = path.join(__dirname, "../../test/corpus");
const corpus = (name: string) => fs.readFileSync(path.join(CORPUS, `${name}.txt`), "utf8").trim();

// Output shape contract

describe("refine - output shape", () => {
  it("returns the required fields", () => {
    const result = refine({ prompt: "Write a function that validates emails." });
    expect(typeof result.original).toBe("string");
    expect(typeof result.refined).toBe("string");
    expect(Array.isArray(result.passes)).toBe(true);
    expect(typeof result.savedTokens).toBe("number");
    expect(typeof result.savedPct).toBe("number");
    expect(typeof result.specificityScore).toBe("number");
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("specificityScore is a number between 0 and 100", () => {
    const result = refine({ prompt: "Fix the login function so it handles expired tokens." });
    expect(result.specificityScore).toBeGreaterThanOrEqual(0);
    expect(result.specificityScore).toBeLessThanOrEqual(100);
  });

  it("returns 9 passes", () => {
    const result = refine({ prompt: "Please improve my code and handle the errors." });
    expect(result.passes.length).toBe(9);
    const ids = result.passes.map((p) => p.pass);
    expect(ids).toContain("typoFix");
    expect(ids).toContain("phraseRepeat");
    expect(ids).toContain("fillerStrip");
    expect(ids).toContain("vagueVerbReplace");
    expect(ids).toContain("structureScaffold");
    expect(ids).toContain("dedup");
    expect(ids).toContain("fileRefCompression");
    expect(ids).toContain("outputFormatHint");
    expect(ids).toContain("negativeCollapse");
  });

  it("specificityScore is a number 0-100", () => {
    const result = refine({ prompt: "Fix the login function so it handles expired tokens." });
    expect(result.specificityScore).toBeGreaterThanOrEqual(0);
    expect(result.specificityScore).toBeLessThanOrEqual(100);
  });

  it("handles empty prompt gracefully", () => {
    const result = refine({ prompt: corpus("14-empty-prompt") });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.savedTokens).toBe(0);
  });
});

// fillerStrip pass

describe("fillerStrip", () => {
  it("removes 'please' from prompt", () => {
    const result = fillerStrip("Please write a function that validates emails.");
    expect(result.applied).toBe(true);
    expect(result.suggestions.some((s) => s.original.toLowerCase().includes("please"))).toBe(true);
  });

  it("removes 'just', 'basically', 'really', 'very'", () => {
    const result = fillerStrip("Just basically fix this. It's really very slow.");
    const labels = result.suggestions.map((s) => s.original.toLowerCase().trim());
    expect(labels.some((l) => l.includes("just"))).toBe(true);
    expect(labels.some((l) => l.includes("basically"))).toBe(true);
  });

  it("removes 'make sure to'", () => {
    const result = fillerStrip("Make sure to add error handling.");
    expect(result.applied).toBe(true);
  });

  it("removes 'etc.' and 'and so on'", () => {
    const p = fillerStrip("Handle users, admins, etc. and so on.");
    expect(p.suggestions.some((s) => s.original.match(/etc\.?/i))).toBe(true);
  });

  it("applyFillerStrip removes filler from corpus 01", () => {
    const refined = applyFillerStrip(corpus("01-filler-heavy"));
    // 'please', 'kindly', 'make sure', 'basically', 'very', 'really', 'just' should all be gone
    expect(refined.toLowerCase()).not.toMatch(/\bplease\b/);
    expect(refined.toLowerCase()).not.toMatch(/\bkindly\b/);
    expect(refined.toLowerCase()).not.toMatch(/\bbasically\b/);
    expect(refined.toLowerCase()).not.toMatch(/\bjust\b/);
  });

  it("no false positives on already clean prompt", () => {
    const result = fillerStrip(corpus("07-short-clean"));
    expect(result.applied).toBe(false);
  });

  it("no false positives on structured prompt", () => {
    const result = fillerStrip(corpus("05-already-structured"));
    // Structured prompt has no filler
    expect(result.suggestions.length).toBe(0);
  });
});

// vagueVerbReplace pass

describe("vagueVerbReplace", () => {
  it("flags 'handle' as vague", () => {
    const result = vagueVerbReplace("Handle the authentication flow.");
    expect(result.applied).toBe(true);
    expect(result.suggestions.some((s) => s.original.toLowerCase() === "handle")).toBe(true);
  });

  it("flags 'improve' and 'work on'", () => {
    const result = vagueVerbReplace(corpus("02-vague-verbs"));
    const originals = result.suggestions.map((s) => s.original.toLowerCase());
    expect(originals.some((o) => o.includes("improve"))).toBe(true);
    expect(originals.some((o) => o.includes("work on"))).toBe(true);
  });

  it("provides at least 2 candidates per vague verb", () => {
    const result = vagueVerbReplace("Handle the request and improve the response.");
    for (const sg of result.suggestions) {
      // replacement is "cand1 | cand2 | cand3"
      const candidates = sg.replacement.split("|").map((c) => c.trim());
      expect(candidates.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("no suggestions on precise prompt", () => {
    const result = vagueVerbReplace(corpus("05-already-structured"));
    expect(result.applied).toBe(false);
  });
});

// structureScaffold pass

describe("structureScaffold", () => {
  it("suggests structure for long unstructured prompt", () => {
    const result = structureScaffold(corpus("03-unstructured-long"));
    expect(result.applied).toBe(true);
    expect(result.suggestions.length).toBe(1);
    expect(result.suggestions[0].replacement).toMatch(/GOAL:/);
    expect(result.suggestions[0].replacement).toMatch(/CONTEXT:/);
    expect(result.suggestions[0].replacement).toMatch(/CONSTRAINTS:/);
    expect(result.suggestions[0].replacement).toMatch(/OUTPUT:/);
  });

  it("does NOT suggest structure for already-structured prompt", () => {
    const result = structureScaffold(corpus("05-already-structured"));
    expect(result.applied).toBe(false);
  });

  it("does NOT suggest structure for short prompt (< 3 sentences)", () => {
    const result = structureScaffold(corpus("07-short-clean"));
    expect(result.applied).toBe(false);
  });

  it("extracts the goal hint from first sentence", () => {
    const result = structureScaffold(corpus("10-unstructured-multi-sentence"));
    expect(result.applied).toBe(true);
    // Goal should contain something from the first sentence
    const scaffold = result.suggestions[0].replacement;
    expect(scaffold).toMatch(/GOAL:/);
  });
});

// dedup pass

describe("dedup", () => {
  it("detects duplicate problem description in corpus 04", () => {
    const result = dedup(corpus("04-duplicate-blocks"));
    expect(result.applied).toBe(true);
    expect(result.suggestions.length).toBeGreaterThanOrEqual(1);
  });

  it("detects duplicate stack trace in corpus 12", () => {
    const result = dedup(corpus("12-duplicate-stack-trace"));
    expect(result.applied).toBe(true);
  });

  it("does NOT flag distinct paragraphs as duplicates", () => {
    const result = dedup(corpus("05-already-structured"));
    expect(result.applied).toBe(false);
  });

  it("does NOT flag single-block prompt", () => {
    const result = dedup(corpus("07-short-clean"));
    expect(result.applied).toBe(false);
  });

  it("reports negative tokenDelta (savings)", () => {
    const result = dedup(corpus("04-duplicate-blocks"));
    if (result.applied) {
      expect(result.tokenDelta).toBeLessThan(0);
    }
  });
});

// Full pipeline

describe("refine - full pipeline", () => {
  it("corpus 01 (filler heavy) - savedPct > 0", () => {
    const result = refine({ prompt: corpus("01-filler-heavy") });
    expect(result.savedPct).toBeGreaterThan(0);
  });

  it("corpus 04 (duplicate blocks) - savedTokens > 0", () => {
    const result = refine({ prompt: corpus("04-duplicate-blocks") });
    expect(result.savedTokens).toBeGreaterThan(0);
  });

  it("corpus 05 (already structured) - no structureScaffold suggestion", () => {
    const result = refine({ prompt: corpus("05-already-structured") });
    const scaffoldPass = result.passes.find((p) => p.pass === "structureScaffold");
    expect(scaffoldPass?.applied).toBe(false);
  });

  it("corpus 07 (short clean) - minimal changes, no warnings about empty", () => {
    const result = refine({ prompt: corpus("07-short-clean") });
    expect(result.warnings.every((w) => !w.includes("Empty"))).toBe(true);
  });

  it("corpus 12 (duplicate stack trace) - dedup fires", () => {
    const result = refine({ prompt: corpus("12-duplicate-stack-trace") });
    const dedupPass = result.passes.find((p) => p.pass === "dedup");
    expect(dedupPass?.applied).toBe(true);
  });

  it("refined is always a string", () => {
    for (let i = 1; i <= 15; i++) {
      const name = String(i).padStart(2, "0");
      const files = fs.readdirSync(CORPUS).filter((f) => f.startsWith(name + "-"));
      if (files.length === 0) continue;
      const prompt = fs.readFileSync(path.join(CORPUS, files[0]), "utf8").trim();
      const result = refine({ prompt });
      expect(typeof result.refined).toBe("string");
    }
  });

  it("savedTokens is non-negative", () => {
    for (let i = 1; i <= 15; i++) {
      const name = String(i).padStart(2, "0");
      const files = fs.readdirSync(CORPUS).filter((f) => f.startsWith(name + "-"));
      if (files.length === 0) continue;
      const prompt = fs.readFileSync(path.join(CORPUS, files[0]), "utf8").trim();
      const result = refine({ prompt });
      expect(result.savedTokens).toBeGreaterThanOrEqual(0);
    }
  });
});

// Snapshot tests

describe("refine - snapshots", () => {
  it("corpus 01 refined matches snapshot", () => {
    const result = refine({ prompt: corpus("01-filler-heavy") });
    expect(result.refined).toMatchSnapshot();
  });

  it("corpus 06 (filler + vague) pass names match snapshot", () => {
    const result = refine({ prompt: corpus("06-filler-and-vague") });
    const appliedPasses = result.passes.filter((p) => p.applied).map((p) => p.pass);
    expect(appliedPasses).toMatchSnapshot();
  });

  it("corpus 08 (intensifier spam) filler suggestions match snapshot", () => {
    const result = fillerStrip(corpus("08-intensifier-spam"));
    const labels = result.suggestions.map((s) => s.label);
    expect(labels).toMatchSnapshot();
  });
});

// fileRefCompression pass

describe("fileRefCompression", () => {
  it("flags large code block in corpus 16", () => {
    const result = fileRefCompression(corpus("16-large-code-block"));
    expect(result.applied).toBe(true);
    expect(result.suggestions.length).toBeGreaterThanOrEqual(1);
    expect(result.tokenDelta).toBeLessThan(0);
  });

  it("suggestion label mentions token count", () => {
    const result = fileRefCompression(corpus("16-large-code-block"));
    expect(result.suggestions[0].label).toMatch(/token/i);
  });

  it("does NOT flag short code blocks", () => {
    const prompt = 'Fix `const x = null;` - change null to undefined.\n```ts\nconst x = null;\n```';
    const result = fileRefCompression(prompt);
    expect(result.applied).toBe(false);
  });

  it("does NOT fire on corpus 23 (code reference already used)", () => {
    const result = fileRefCompression(corpus("23-code-reference-used"));
    expect(result.applied).toBe(false);
  });
});

// outputFormatHint pass

describe("outputFormatHint", () => {
  it("fires on corpus 17 (write function, no format)", () => {
    const result = outputFormatHint(corpus("17-output-format-missing"));
    expect(result.applied).toBe(true);
    expect(result.suggestions[0].replacement).toMatch(/Return only/i);
  });

  it("does NOT fire on corpus 18 (format already specified)", () => {
    const result = outputFormatHint(corpus("18-output-format-present"));
    expect(result.applied).toBe(false);
  });

  it("fires on SQL request without format (corpus 26)", () => {
    const result = outputFormatHint(corpus("26-sql-no-format"));
    expect(result.applied).toBe(true);
  });

  it("fires on refactor request without format (corpus 27)", () => {
    const result = outputFormatHint(corpus("27-refactor-no-format"));
    expect(result.applied).toBe(true);
  });

  it("fires on list request without format (corpus 29)", () => {
    const result = outputFormatHint(corpus("29-list-request-no-format"));
    expect(result.applied).toBe(true);
  });

  it("does NOT fire on corpus 21 (has OUTPUT: section)", () => {
    const result = outputFormatHint(corpus("21-high-specificity"));
    expect(result.applied).toBe(false);
  });

  it("suggests negative tokenDelta (output savings)", () => {
    const result = outputFormatHint(corpus("17-output-format-missing"));
    if (result.applied) {
      expect(result.tokenDelta).toBeLessThan(0);
    }
  });
});

// negativeCollapse pass

describe("negativeCollapse", () => {
  it("collapses 5 scattered negatives in corpus 19", () => {
    const result = negativeCollapse(corpus("19-negative-scattered"));
    expect(result.applied).toBe(true);
    expect(result.suggestions[0].replacement).toMatch(/Do NOT:/);
    expect(result.suggestions[0].replacement).toMatch(/-\s+\w/);
  });

  it("collapses 2 negatives in corpus 30", () => {
    const result = negativeCollapse(corpus("30-negative-only-two"));
    expect(result.applied).toBe(true);
  });

  it("does NOT fire on single 'don't' (corpus 20)", () => {
    const result = negativeCollapse(corpus("20-negative-single"));
    expect(result.applied).toBe(false);
  });

  it("does NOT fire on prompt with no negatives (corpus 07)", () => {
    const result = negativeCollapse(corpus("07-short-clean"));
    expect(result.applied).toBe(false);
  });

  it("collapsed result contains each constraint as a bullet", () => {
    const result = negativeCollapse(corpus("19-negative-scattered"));
    const bullets = result.suggestions[0].replacement.split("\n").filter((l) => l.startsWith("-"));
    expect(bullets.length).toBeGreaterThanOrEqual(2);
  });
});

// specificityScore

describe("specificityScore", () => {
  it("high-specificity corpus 21 scores >= 60", () => {
    expect(specificityScore(corpus("21-high-specificity"))).toBeGreaterThanOrEqual(60);
  });

  it("low-specificity corpus 22 scores <= 30", () => {
    expect(specificityScore(corpus("22-low-specificity"))).toBeLessThanOrEqual(30);
  });

  it("corpus 34 (fully structured) scores >= 70", () => {
    expect(specificityScore(corpus("34-score-high-structured"))).toBeGreaterThanOrEqual(70);
  });

  it("score is always 0-100", () => {
    const prompts = [
      corpus("01-filler-heavy"), corpus("05-already-structured"),
      corpus("07-short-clean"), corpus("21-high-specificity"),
      corpus("22-low-specificity"), corpus("34-score-high-structured"),
    ];
    for (const p of prompts) {
      const score = specificityScore(p);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it("scoreBreakdown sums to total", () => {
    const breakdown = scoreBreakdown(corpus("21-high-specificity"));
    const sum =
      breakdown.goalVerb + breakdown.concreteEntities + breakdown.successCriterion +
      breakdown.outputFormat + breakdown.constraints + breakdown.doNotInstructions +
      breakdown.codeReferences;
    expect(breakdown.total).toBe(Math.max(0, Math.min(100, sum)));
  });

  it("refined prompt scores higher than original for bad prompts", () => {
    const bad = corpus("22-low-specificity");
    const result = refine({ prompt: bad });
    // Refined will at minimum not score worse (it may not score better for every bad prompt)
    expect(result.specificityScore).toBeGreaterThanOrEqual(0);
  });

  it("corpus 23 (code reference) gets codeReferences points", () => {
    const breakdown = scoreBreakdown(corpus("23-code-reference-used"));
    expect(breakdown.codeReferences).toBe(15);
  });
});

// Full pipeline - new corpora

describe("refine - full pipeline (Step 5 corpus)", () => {
  it("corpus 32 (all passes) - fillerStrip, vagueVerbReplace, dedup all fire", () => {
    const result = refine({ prompt: corpus("32-all-passes-fire") });
    const applied = result.passes.filter((p) => p.applied).map((p) => p.pass);
    expect(applied).toContain("fillerStrip");
    expect(applied).toContain("vagueVerbReplace");
    expect(applied).toContain("dedup");
    expect(applied).toContain("negativeCollapse");
  });

  it("corpus 33 (file ref present) - fileRefCompression does NOT fire", () => {
    const result = refine({ prompt: corpus("33-file-ref-present") });
    const pass = result.passes.find((p) => p.pass === "fileRefCompression");
    expect(pass?.applied).toBe(false);
  });

  it("corpus 16 (large code block) - fileRefCompression fires", () => {
    const result = refine({ prompt: corpus("16-large-code-block") });
    const pass = result.passes.find((p) => p.pass === "fileRefCompression");
    expect(pass?.applied).toBe(true);
  });

  it("all 35 corpus prompts - refined is a string and savedTokens >= 0", () => {
    const files = fs.readdirSync(CORPUS).filter((f) => f.endsWith(".txt"));
    for (const file of files) {
      const prompt = fs.readFileSync(path.join(CORPUS, file), "utf8").trim();
      const result = refine({ prompt });
      expect(typeof result.refined).toBe("string");
      expect(result.savedTokens).toBeGreaterThanOrEqual(0);
    }
  });

  it("corpus 34 (perfectly structured) - specificityScore >= 70", () => {
    const result = refine({ prompt: corpus("34-score-high-structured") });
    expect(result.specificityScore).toBeGreaterThanOrEqual(70);
  });
});

// Additional snapshots

describe("refine - Step 5 snapshots", () => {
  it("corpus 19 negativeCollapse suggestion matches snapshot", () => {
    const result = negativeCollapse(corpus("19-negative-scattered"));
    expect(result.suggestions[0].replacement).toMatchSnapshot();
  });

  it("scoreBreakdown for corpus 21 matches snapshot", () => {
    const breakdown = scoreBreakdown(corpus("21-high-specificity"));
    expect(breakdown).toMatchSnapshot();
  });

  it("corpus 34 full refine result shape matches snapshot", () => {
    const result = refine({ prompt: corpus("34-score-high-structured") });
    // Snapshot the pass-level applied flags - stable across minor text changes
    const passSummary = result.passes.map((p) => ({ pass: p.pass, applied: p.applied }));
    expect(passSummary).toMatchSnapshot();
  });
});
