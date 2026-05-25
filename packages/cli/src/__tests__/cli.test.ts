import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as os from "node:os";
import * as fs from "node:fs";
import * as path from "node:path";

// format helpers

import { fmtTokens, fmtUsd, fmtPct, scoreBar } from "../output/format";

describe("format — fmtTokens", () => {
  it("formats small numbers as-is", () => {
    expect(fmtTokens(500)).toBe("500");
  });
  it("formats thousands with k suffix", () => {
    expect(fmtTokens(1500)).toBe("1.5k");
    expect(fmtTokens(10000)).toBe("10.0k");
  });
  it("formats millions with M suffix", () => {
    expect(fmtTokens(1_200_000)).toBe("1.2M");
  });
});

describe("format — fmtUsd", () => {
  it("formats tiny costs with < prefix", () => {
    expect(fmtUsd(0.0001)).toBe("< $0.001");
  });
  it("formats sub-cent costs to 4dp", () => {
    expect(fmtUsd(0.005)).toMatch(/^\$0\.005/);
  });
  it("formats normal costs to 3dp", () => {
    expect(fmtUsd(0.123)).toBe("$0.123");
  });
});

describe("format — fmtPct", () => {
  it("formats to 1 decimal", () => {
    expect(fmtPct(12.567)).toBe("12.6%");
  });
});

describe("format — scoreBar", () => {
  it("returns a string containing the score", () => {
    const bar = scoreBar(75);
    expect(bar).toContain("75");
  });
  it("100-score bar has no empty blocks", () => {
    const bar = scoreBar(100, 10);
    expect(bar).toContain("██████████");
  });
  it("0-score bar has no filled blocks", () => {
    const bar = scoreBar(0, 10);
    expect(bar).toContain("░░░░░░░░░░");
  });
});

// history store

import {
  appendHistory, getHistory, getHistoryEntry, clearHistory, historyToCsv,
} from "../history";
import { analyze } from "@ctok/core";
import { runInit } from "../commands/init";

const makeEntry = (prompt: string) => ({
  prompt,
  result: analyze({ prompt, files: [], taskType: "general" as const }),
});

describe("history store", () => {
  let tmpDir: string;
  let origEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    origEnv = { ...process.env };
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ctok-hist-"));
    process.env["CTOK_HOME"] = path.join(tmpDir, ".ctok");
  });

  afterEach(() => {
    process.env = origEnv;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("appends and retrieves entries", () => {
    appendHistory(makeEntry("Fix the login function"));
    const entries = getHistory();
    expect(entries).toHaveLength(1);
    expect(entries[0].prompt).toBe("Fix the login function");
  });

  it("getHistory returns newest first", () => {
    appendHistory(makeEntry("First prompt"));
    appendHistory(makeEntry("Second prompt"));
    const entries = getHistory();
    expect(entries[0].prompt).toBe("Second prompt");
  });

  it("getHistory respects limit", () => {
    for (let i = 0; i < 5; i++) appendHistory(makeEntry(`Prompt ${i}`));
    expect(getHistory(3)).toHaveLength(3);
  });

  it("getHistoryEntry finds by id", () => {
    const e = appendHistory(makeEntry("Specific prompt"));
    const found = getHistoryEntry(e.id);
    expect(found?.prompt).toBe("Specific prompt");
  });

  it("getHistoryEntry returns undefined for unknown id", () => {
    expect(getHistoryEntry("h0000000")).toBeUndefined();
  });

  it("clearHistory empties the store", () => {
    appendHistory(makeEntry("Will be cleared"));
    clearHistory();
    expect(getHistory()).toHaveLength(0);
  });

  it("each entry has a unique id and valid ISO timestamp", () => {
    const a = appendHistory(makeEntry("A"));
    const b = appendHistory(makeEntry("B"));
    expect(a.id).not.toBe(b.id);
    expect(() => new Date(a.timestamp)).not.toThrow();
  });

  it("historyToCsv produces a header and one row per entry", () => {
    appendHistory(makeEntry("csv test"));
    const csv = historyToCsv(getHistory());
    const lines = csv.trim().split("\n");
    expect(lines[0]).toContain("id,timestamp,prompt");
    expect(lines).toHaveLength(2);
  });

  it("historyToCsv escapes double-quotes in prompts", () => {
    appendHistory(makeEntry('Say "hello" to me'));
    const csv = historyToCsv(getHistory());
    expect(csv).toContain('""hello""');
  });
});

// command logic (pure function layer)

describe("check — output contract", () => {
  it("analyze result has the expected shape", () => {
    const result = analyze({ prompt: "Refactor the auth module", files: [], taskType: "general" });
    expect(typeof result.estimate.input.expected).toBe("number");
    expect(typeof result.cost.totalUsd).toBe("number");
    expect(typeof result.recommendation.model.model).toBe("string");
  });
});

describe("init — template content", () => {
  let tmpDir: string;
  let origCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ctok-init-"));
    origCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates .ctokignore with node_modules pattern", () => {
    runInit({});
    const content = fs.readFileSync(path.join(tmpDir, ".ctokignore"), "utf8");
    expect(content).toContain("node_modules/");
  });

  it("creates CLAUDE.md with GOAL section placeholder", () => {
    runInit({});
    const content = fs.readFileSync(path.join(tmpDir, "CLAUDE.md"), "utf8");
    expect(content).toContain("Project overview");
  });

  it("does not overwrite existing files without --force", () => {
    fs.writeFileSync(path.join(tmpDir, ".ctokignore"), "# custom\n");
    runInit({});
    const content = fs.readFileSync(path.join(tmpDir, ".ctokignore"), "utf8");
    expect(content).toBe("# custom\n");
  });

  it("overwrites with --force", () => {
    fs.writeFileSync(path.join(tmpDir, ".ctokignore"), "# old\n");
    runInit({ force: true });
    const content = fs.readFileSync(path.join(tmpDir, ".ctokignore"), "utf8");
    expect(content).toContain("node_modules/");
  });
});
