import { describe, it, expect, vi } from "vitest";
import type { RespondArguments } from "@slack/bolt";
import { parseArgs } from "../parseArgs";
import { handleCheck } from "../commands/check";
import { handleRefine } from "../commands/refine";
import { fmtTokens, fmtUsd, effortEmoji } from "../format";

// parseArgs

describe("parseArgs", () => {
  it("defaults to check subcommand when no sub given", () => {
    const r = parseArgs("Explain how JWT works");
    expect(r.subcommand).toBe("check");
    expect(r.text).toBe("Explain how JWT works");
  });

  it("parses explicit check subcommand", () => {
    const r = parseArgs("check Fix the auth bug");
    expect(r.subcommand).toBe("check");
    expect(r.text).toBe("Fix the auth bug");
  });

  it("parses refine subcommand", () => {
    const r = parseArgs("refine Please kindly help me fix this");
    expect(r.subcommand).toBe("refine");
    expect(r.text).toBe("Please kindly help me fix this");
  });

  it("parses scan subcommand with path", () => {
    const r = parseArgs("scan /tmp/myproject");
    expect(r.subcommand).toBe("scan");
    expect(r.text).toBe("/tmp/myproject");
  });

  it("parses --model flag", () => {
    const r = parseArgs("check Hello --model haiku-4-5");
    expect(r.model).toBe("haiku-4-5");
    expect(r.text).toBe("Hello");
  });

  it("parses --plan flag", () => {
    const r = parseArgs("check Hello --plan max5x");
    expect(r.plan).toBe("max5x");
  });

  it("parses --task flag", () => {
    const r = parseArgs("check Hello --task bug-fix");
    expect(r.taskType).toBe("bug-fix");
  });

  it("parses --task-type flag", () => {
    const r = parseArgs("check Hello --task-type refactor");
    expect(r.taskType).toBe("refactor");
  });

  it("handles help subcommand", () => {
    const r = parseArgs("help");
    expect(r.subcommand).toBe("help");
    expect(r.text).toBe("");
  });

  it("handles empty string", () => {
    const r = parseArgs("");
    expect(r.subcommand).toBe("check");
    expect(r.text).toBe("");
  });

  it("combines multiple flags and text", () => {
    const r = parseArgs("check Fix the login --model sonnet-4-6 --plan pro --task bug-fix");
    expect(r.subcommand).toBe("check");
    expect(r.text).toBe("Fix the login");
    expect(r.model).toBe("sonnet-4-6");
    expect(r.plan).toBe("pro");
    expect(r.taskType).toBe("bug-fix");
  });
});

// handleCheck

describe("handleCheck", () => {
  it("calls respond with blocks containing token estimate", async () => {
    const responded: unknown[] = [];
    const respond = vi.fn(async (opts: RespondArguments) => {
      if (opts.blocks) responded.push(...opts.blocks);
    });

    await handleCheck({ subcommand: "check", text: "Fix the auth module" }, respond);

    expect(respond).toHaveBeenCalledOnce();
    expect(responded.length).toBeGreaterThan(0);
  });

  it("returns usage hint when text is empty", async () => {
    let responseText = "";
    const respond = vi.fn(async (opts: RespondArguments) => {
      responseText = JSON.stringify(opts.blocks);
    });

    await handleCheck({ subcommand: "check", text: "" }, respond);
    expect(responseText).toContain("Usage");
  });

  it("includes quota block when plan is provided", async () => {
    let responseBlocks: unknown[] = [];
    const respond = vi.fn(async (opts: RespondArguments) => {
      responseBlocks = opts.blocks ?? [];
    });

    await handleCheck(
      { subcommand: "check", text: "Fix the auth module", plan: "pro" },
      respond,
    );

    const text = JSON.stringify(responseBlocks);
    expect(text).toContain("Quota impact");
  });

  it("omits quota block for api plan", async () => {
    let responseBlocks: unknown[] = [];
    const respond = vi.fn(async (opts: RespondArguments) => {
      responseBlocks = opts.blocks ?? [];
    });

    await handleCheck(
      { subcommand: "check", text: "Fix the auth module", plan: "api" },
      respond,
    );

    const text = JSON.stringify(responseBlocks);
    expect(text).not.toContain("Quota impact");
  });
});

// handleRefine

describe("handleRefine", () => {
  it("returns refined prompt blocks", async () => {
    let responseBlocks: unknown[] = [];
    const respond = vi.fn(async (opts: RespondArguments) => {
      responseBlocks = opts.blocks ?? [];
    });

    await handleRefine(
      { subcommand: "refine", text: "Please kindly help me fix the thing in the module" },
      respond,
    );

    expect(respond).toHaveBeenCalledOnce();
    const text = JSON.stringify(responseBlocks);
    expect(text).toContain("Refined");
  });

  it("returns usage hint when text is empty", async () => {
    let responseText = "";
    const respond = vi.fn(async (opts: RespondArguments) => {
      responseText = JSON.stringify(opts.blocks);
    });

    await handleRefine({ subcommand: "refine", text: "" }, respond);
    expect(responseText).toContain("Usage");
  });
});

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
