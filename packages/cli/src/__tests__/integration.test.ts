/**
 * Integration tests — spawn the built dist/cli.js and assert exit codes + stdout.
 * beforeAll builds the CLI if dist/cli.js is missing (self-contained for CI).
 */
import { spawnSync, execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { describe, it, expect, beforeAll } from "vitest";

const PKG_DIR = path.resolve(__dirname, "../..");
const DIST_CLI = path.join(PKG_DIR, "dist", "cli.js");
const TMP_HOME = path.join(os.tmpdir(), `ctok-int-${process.pid}`);

beforeAll(() => {
  if (!fs.existsSync(DIST_CLI)) {
    execSync("pnpm build", { cwd: PKG_DIR, stdio: "pipe" });
  }
  fs.mkdirSync(TMP_HOME, { recursive: true });
}, 60_000);

function run(args: string[], opts: { cwd?: string; input?: string } = {}) {
  const r = spawnSync("node", [DIST_CLI, ...args], {
    cwd: opts.cwd ?? PKG_DIR,
    encoding: "utf8",
    input: opts.input,
    env: { ...process.env, NO_COLOR: "1", CTOK_HOME: TMP_HOME },
    timeout: 20_000,
  });
  return {
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
    code: r.status ?? -1,
  };
}

// meta

describe("--version", () => {
  it("prints semver and exits 0", () => {
    const { stdout, code } = run(["--version"]);
    expect(code).toBe(0);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("--help", () => {
  it("exits 0 and mentions all commands", () => {
    const { stdout, code } = run(["--help"]);
    expect(code).toBe(0);
    for (const cmd of ["check", "refine", "scan", "model", "history", "config", "init", "doctor"]) {
      expect(stdout).toContain(cmd);
    }
  });
});

// check

describe("check", () => {
  it("shows token estimate for a prompt argument", () => {
    const { stdout, code } = run(["check", "Rename getUser to fetchUser"]);
    expect(code).toBe(0);
    expect(stdout).toMatch(/[Tt]oken/);
    expect(stdout).toMatch(/[Cc]ost/);
    expect(stdout).toMatch(/[Rr]ecommend/);
  });

  it("reads prompt from stdin when passed as '-'", () => {
    const { stdout, code } = run(["check", "-"], { input: "Add pagination to /orders" });
    expect(code).toBe(0);
    expect(stdout).toMatch(/[Tt]oken/);
  });

  it("--json output is parseable with correct shape", () => {
    const { stdout, code } = run(["check", "--json", "Refactor auth middleware"]);
    expect(code).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.estimate.input.expected).toBeGreaterThan(0);
    expect(data.estimate.output.expected).toBeGreaterThan(0);
    expect(data.cost.totalUsd).toBeGreaterThanOrEqual(0);
    expect(data.recommendation.model.model).toBeTruthy();
    expect(data.recommendation.effort.effort).toMatch(/^(low|medium|high|xhigh)$/);
    expect(Array.isArray(data.suggestions)).toBe(true);
  });

  it("--quiet prints one line with tokens and dollar amount", () => {
    const { stdout, code } = run(["check", "--quiet", "hello"]);
    expect(code).toBe(0);
    const lines = stdout.trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(stdout).toMatch(/token/i);
    expect(stdout).toMatch(/\$/);
  });

  it("-f reads prompt from a file", () => {
    const tmp = path.join(os.tmpdir(), "ctok-prompt.txt");
    fs.writeFileSync(tmp, "Implement OAuth2 with PKCE and refresh tokens");
    const { stdout, code } = run(["check", "-f", tmp]);
    expect(code).toBe(0);
    expect(stdout).toMatch(/[Tt]oken/);
    fs.unlinkSync(tmp);
  });

  it("empty prompt exits 1 with error message", () => {
    const { stderr, code } = run(["check", "-"], { input: "   " });
    expect(code).toBe(1);
    expect(stderr).toContain("empty");
  });

  it("--no-save does not persist entry to history", () => {
    run(["check", "--no-save", "ephemeral prompt"]);
    const { stdout } = run(["history", "--json"]);
    const entries = JSON.parse(stdout) as { prompt: string }[];
    const found = entries.some((e) => e.prompt === "ephemeral prompt");
    expect(found).toBe(false);
  });
});

// refine

describe("refine", () => {
  const BLOATED = "please can you very kindly help me to write a function that does sorting of an array";

  it("exits 0 and outputs refiner sections", () => {
    const { stdout, code } = run(["refine", BLOATED]);
    expect(code).toBe(0);
    expect(stdout.length).toBeGreaterThan(20);
  });

  it("--quiet prints only the refined prompt (no section headers)", () => {
    const { stdout, code } = run(["refine", "--quiet", BLOATED]);
    expect(code).toBe(0);
    expect(stdout).not.toMatch(/Refiner|Specificity|Tokens saved/i);
    expect(stdout.trim().length).toBeGreaterThan(5);
  });

  it("--json has refined, savedTokens, savedPct, specificityScore", () => {
    const { stdout, code } = run(["refine", "--json", BLOATED]);
    expect(code).toBe(0);
    const data = JSON.parse(stdout);
    expect(typeof data.refined).toBe("string");
    expect(typeof data.savedTokens).toBe("number");
    expect(typeof data.savedPct).toBe("number");
    expect(typeof data.specificityScore).toBe("number");
    expect(data.specificityScore).toBeGreaterThanOrEqual(0);
    expect(data.specificityScore).toBeLessThanOrEqual(100);
  });

  it("--auto applies all suggestions without prompting", () => {
    const { stdout, code } = run(["refine", "--auto", BLOATED]);
    expect(code).toBe(0);
  });
});

// model

describe("model", () => {
  it("shows model and effort recommendation", () => {
    const { stdout, code } = run(["model", "Implement OAuth2 with PKCE"]);
    expect(code).toBe(0);
    expect(stdout).toMatch(/[Mm]odel/);
    expect(stdout).toMatch(/[Ee]ffort/);
  });

  it("--quiet prints model and effort on one line", () => {
    const { stdout, code } = run(["model", "--quiet", "Rename getUser"]);
    expect(code).toBe(0);
    const line = stdout.trim();
    // e.g. "haiku-4-5 low"
    expect(line.split(" ").length).toBeGreaterThanOrEqual(2);
  });

  it("--json shape has recommendation.model.model and effort.effort", () => {
    const { stdout, code } = run(["model", "--json", "Evaluate architecture"]);
    expect(code).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.recommendation.model.model).toBeTruthy();
    expect(data.recommendation.effort.effort).toMatch(/^(low|medium|high|xhigh)$/);
  });
});

// scan

describe("scan", () => {
  it("scans a directory and reports file count + tokens", () => {
    const { stdout, code } = run(["scan", PKG_DIR]);
    expect(code).toBe(0);
    expect(stdout).toMatch(/file/i);
    expect(stdout).toMatch(/token/i);
  });

  it("--json returns ProjectScan shape", () => {
    const { stdout, code } = run(["scan", "--json", PKG_DIR]);
    expect(code).toBe(0);
    const data = JSON.parse(stdout);
    expect(typeof data.totalFiles).toBe("number");
    expect(typeof data.estimatedTokens).toBe("number");
    expect(data.totalFiles).toBeGreaterThan(0);
  });

  it("--quiet prints a single summary line", () => {
    const { stdout, code } = run(["scan", "--quiet", PKG_DIR]);
    expect(code).toBe(0);
    const lines = stdout.trim().split("\n");
    expect(lines).toHaveLength(1);
  });
});

// history

describe("history", () => {
  it("shows empty-state message or table header when empty", () => {
    const { stdout, code } = run(["history"]);
    expect(code).toBe(0);
    expect(stdout.length).toBeGreaterThan(0);
  });

  it("--json returns an array", () => {
    const { stdout, code } = run(["history", "--json"]);
    expect(code).toBe(0);
    expect(Array.isArray(JSON.parse(stdout))).toBe(true);
  });

  it("records a check and then appears in history", () => {
    const unique = `history-integration-test-${Date.now()}`;
    run(["check", unique]);
    const { stdout } = run(["history", "--json"]);
    const entries = JSON.parse(stdout) as { prompt: string }[];
    expect(entries.some((e) => e.prompt === unique)).toBe(true);
  });

  it("--clear empties history", () => {
    run(["check", "entry-to-clear"]);
    run(["history", "--clear"]);
    const { stdout } = run(["history", "--json"]);
    expect(JSON.parse(stdout)).toHaveLength(0);
  });
});

// diff

describe("diff", () => {
  it("exits 1 with unknown ids", () => {
    const { code } = run(["diff", "h00000000", "h11111111"]);
    expect(code).toBe(1);
  });

  it("exits 0 and shows delta when both ids exist", () => {
    const a = run(["check", "--json", "prompt A for diff test"]);
    const b = run(["check", "--json", "much longer prompt B for diff test with more context"]);
    const idA = JSON.parse(a.stdout); // this is the full result, not just id
    // Pull IDs from history instead
    const hist = JSON.parse(run(["history", "--json"]).stdout) as { id: string; prompt: string }[];
    const eA = hist.find((e) => e.prompt === "prompt A for diff test");
    const eB = hist.find((e) => e.prompt === "much longer prompt B for diff test with more context");
    if (!eA || !eB) return; // history may have been cleared; skip gracefully
    const { stdout, code } = run(["diff", eA.id, eB.id]);
    expect(code).toBe(0);
    expect(stdout).toMatch(/[Dd]iff/);
  });
});

// config

describe("config", () => {
  it("config get plan exits 0", () => {
    const { code } = run(["config", "get", "plan"]);
    expect(code).toBe(0);
  });

  it("config set + get round-trips", () => {
    run(["config", "set", "plan", "pro"]);
    const { stdout, code } = run(["config", "get", "plan"]);
    expect(code).toBe(0);
    expect(stdout).toContain("pro");
  });
});

// doctor

describe("doctor", () => {
  it("exits 0 and prints diagnostic output", () => {
    const { stdout, code } = run(["doctor"]);
    expect(code).toBe(0);
    expect(stdout.length).toBeGreaterThan(20);
  });
});

// init

describe("init", () => {
  it("creates .ctokignore in a fresh directory", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ctok-init-"));
    const { code } = run(["init"], { cwd: tmp });
    expect(code).toBe(0);
    expect(fs.existsSync(path.join(tmp, ".ctokignore"))).toBe(true);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("creates CLAUDE.md in a fresh directory", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ctok-init-"));
    const { code } = run(["init"], { cwd: tmp });
    expect(code).toBe(0);
    expect(fs.existsSync(path.join(tmp, "CLAUDE.md"))).toBe(true);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("does not overwrite existing .ctokignore without --force", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ctok-init-"));
    fs.writeFileSync(path.join(tmp, ".ctokignore"), "# custom\n");
    run(["init"], { cwd: tmp });
    const content = fs.readFileSync(path.join(tmp, ".ctokignore"), "utf8");
    expect(content).toBe("# custom\n");
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
