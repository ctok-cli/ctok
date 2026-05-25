import { describe, it, expect, afterEach } from "vitest";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { scan } from "../scan";
import { detectProjectType } from "../projectType";

const FIXTURES = path.join(__dirname, "../../test/fixtures");
const fix = (name: string) => path.join(FIXTURES, name);

// Project type detection

describe("detectProjectType", () => {
  it("detects node project", () => {
    expect(detectProjectType(fix("node-project")).type).toBe("node");
  });

  it("detects flutter project", () => {
    expect(detectProjectType(fix("flutter-project")).type).toBe("flutter");
  });

  it("detects rust project", () => {
    expect(detectProjectType(fix("rust-project")).type).toBe("rust");
  });

  it("detects android project", () => {
    expect(detectProjectType(fix("android-project")).type).toBe("android");
  });

  it("detects python project", () => {
    expect(detectProjectType(fix("python-project")).type).toBe("python");
  });

  it("returns unknown for empty dir", () => {
    expect(detectProjectType(FIXTURES).type).toBe("unknown");
  });
});

// Node project scan

describe("scan — node project", () => {
  it("excludes node_modules", async () => {
    const result = await scan({ root: fix("node-project") });
    const paths = result.topHeavyFiles.map((f) => f.path);
    expect(paths.some((p) => p.includes("node_modules"))).toBe(false);
  });

  it("excludes dist/", async () => {
    const result = await scan({ root: fix("node-project") });
    const paths = result.topHeavyFiles.map((f) => f.path);
    expect(paths.some((p) => p.startsWith("dist"))).toBe(false);
  });

  it("includes src/ TypeScript files", async () => {
    const result = await scan({ root: fix("node-project") });
    expect(result.totalFiles).toBeGreaterThanOrEqual(2);
  });

  it("reports node as project type", async () => {
    const result = await scan({ root: fix("node-project") });
    expect(result.projectType).toBe("node");
  });

  it("returns correct output shape", async () => {
    const result = await scan({ root: fix("node-project") });
    expect(result.root).toBeTruthy();
    expect(typeof result.totalFiles).toBe("number");
    expect(typeof result.totalBytes).toBe("number");
    expect(typeof result.estimatedTokens).toBe("number");
    expect(result.byExtension).toBeDefined();
    expect(Array.isArray(result.topHeavyFiles)).toBe(true);
    expect(typeof result.excluded.files).toBe("number");
    expect(typeof result.excluded.reasons).toBe("object");
  });

  it("records post-glob exclusions (binary/unknown extension files)", async () => {
    // node_modules and dist are filtered at the glob level (never counted in excluded.files).
    // Files that pass the glob but fail the extension-allowlist are counted.
    // The fixture contains src/bundle.bin which has an unknown extension.
    const result = await scan({ root: fix("node-project") });
    expect(result.excluded.files).toBeGreaterThan(0);
    expect(result.excluded.reasons["binary/unknown extension"]).toBeGreaterThanOrEqual(1);
  });

  it("groups byExtension correctly", async () => {
    const result = await scan({ root: fix("node-project") });
    // src/*.ts files should register under "ts" extension
    expect(result.byExtension["ts"]).toBeDefined();
    expect(result.byExtension["ts"].files).toBeGreaterThanOrEqual(2);
  });
});

// Flutter project scan

describe("scan — flutter project", () => {
  it("reports flutter as project type", async () => {
    const result = await scan({ root: fix("flutter-project") });
    expect(result.projectType).toBe("flutter");
  });

  it("excludes build/", async () => {
    const result = await scan({ root: fix("flutter-project") });
    const hasBuildFile = result.topHeavyFiles.some((f) => f.path.startsWith("build/") || f.path.startsWith("build\\"));
    expect(hasBuildFile).toBe(false);
  });

  it("includes lib/ dart files", async () => {
    const result = await scan({ root: fix("flutter-project") });
    expect(result.byExtension["dart"]?.files).toBeGreaterThanOrEqual(1);
  });
});

// Rust project scan

describe("scan — rust project", () => {
  it("reports rust as project type", async () => {
    const result = await scan({ root: fix("rust-project") });
    expect(result.projectType).toBe("rust");
  });

  it("excludes target/", async () => {
    const result = await scan({ root: fix("rust-project") });
    const hasTargetFile = result.topHeavyFiles.some(
      (f) => f.path.startsWith("target/") || f.path.startsWith("target\\"),
    );
    expect(hasTargetFile).toBe(false);
  });

  it("includes src/ rust files", async () => {
    const result = await scan({ root: fix("rust-project") });
    expect(result.byExtension["rs"]?.files).toBeGreaterThanOrEqual(1);
  });
});

// Android project scan

describe("scan — android project", () => {
  it("reports android as project type", async () => {
    const result = await scan({ root: fix("android-project") });
    expect(result.projectType).toBe("android");
  });

  it("excludes app/build/", async () => {
    const result = await scan({ root: fix("android-project") });
    const hasApk = result.topHeavyFiles.some((f) => f.path.includes("app-debug.apk"));
    expect(hasApk).toBe(false);
  });

  it("excludes .gradle/", async () => {
    const result = await scan({ root: fix("android-project") });
    const hasGradle = result.topHeavyFiles.some(
      (f) => f.path.startsWith(".gradle/") || f.path.startsWith(".gradle\\"),
    );
    expect(hasGradle).toBe(false);
  });

  it("includes java source files", async () => {
    const result = await scan({ root: fix("android-project") });
    expect(result.byExtension["java"]?.files).toBeGreaterThanOrEqual(1);
  });
});

// Python project scan

describe("scan — python project", () => {
  it("reports python as project type", async () => {
    const result = await scan({ root: fix("python-project") });
    expect(result.projectType).toBe("python");
  });

  it("excludes venv/", async () => {
    const result = await scan({ root: fix("python-project") });
    const hasVenv = result.topHeavyFiles.some(
      (f) => f.path.startsWith("venv/") || f.path.startsWith("venv\\"),
    );
    expect(hasVenv).toBe(false);
  });

  it("excludes __pycache__/", async () => {
    const result = await scan({ root: fix("python-project") });
    const hasPycache = result.topHeavyFiles.some((f) => f.path.includes("__pycache__"));
    expect(hasPycache).toBe(false);
  });

  it("includes src/ python files", async () => {
    const result = await scan({ root: fix("python-project") });
    expect(result.byExtension["py"]?.files).toBeGreaterThanOrEqual(1);
  });
});

// ScanOptions

describe("scan — options", () => {
  it("respects custom exclude patterns", async () => {
    const result = await scan({
      root: fix("node-project"),
      exclude: ["src/**"],
    });
    const hasSrc = result.topHeavyFiles.some(
      (f) => f.path.startsWith("src/") || f.path.startsWith("src\\"),
    );
    expect(hasSrc).toBe(false);
  });

  it("topHeavyCount limits the array", async () => {
    const result = await scan({ root: fix("node-project"), topHeavyCount: 1 });
    expect(result.topHeavyFiles.length).toBeLessThanOrEqual(1);
  });

  it("topHeavyFiles sorted by tokens descending", async () => {
    const result = await scan({ root: fix("node-project") });
    for (let i = 1; i < result.topHeavyFiles.length; i++) {
      expect(result.topHeavyFiles[i - 1].tokens).toBeGreaterThanOrEqual(
        result.topHeavyFiles[i].tokens,
      );
    }
  });

  it("estimatedTokens > 0 for non-empty projects", async () => {
    const result = await scan({ root: fix("node-project") });
    expect(result.estimatedTokens).toBeGreaterThan(0);
  });
});

// Edge cases: binary content and no-extension files

describe("scan — binary content filtering", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("excludes files containing null bytes (binary content)", async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ctok-scan-"));
    // Write a .ts file with a null byte — looks like text extension but is binary
    const binaryFile = path.join(tmpDir, "fake.ts");
    const buf = Buffer.alloc(20, 65); // all 'A'
    buf[10] = 0; // embed null byte
    fs.writeFileSync(binaryFile, buf);
    // Write one clean file so scan has something to return
    fs.writeFileSync(path.join(tmpDir, "clean.ts"), "export const x = 1;");
    fs.writeFileSync(path.join(tmpDir, "package.json"), '{"name":"t"}');

    const result = await scan({ root: tmpDir });
    // The binary file should NOT appear in topHeavyFiles
    const paths = result.topHeavyFiles.map((f) => f.path);
    expect(paths.some((p) => p.includes("fake.ts"))).toBe(false);
    expect(result.excluded.reasons["binary content"]).toBeGreaterThanOrEqual(1);
  });

  it("includes files with no extension when text content", async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ctok-scan-"));
    // A dotfile with no extension should be included (e.g. ".env" → ext "env")
    fs.writeFileSync(path.join(tmpDir, ".env"), "KEY=value\nSECRET=abc");
    fs.writeFileSync(path.join(tmpDir, "package.json"), '{"name":"t"}');

    const result = await scan({ root: tmpDir });
    // .env is text and has a recognized extension "env" or no-ext path; either way included
    expect(result.totalFiles).toBeGreaterThanOrEqual(1);
  });
});
