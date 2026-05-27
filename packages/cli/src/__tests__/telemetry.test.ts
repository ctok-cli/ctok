import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// We test the telemetry module in isolation by controlling the env var and
// mocking readCtokConfig - no actual HTTP calls are made.

vi.mock("@ctok/quota", () => ({
  readCtokConfig: vi.fn(() => undefined),
}));

// Import after mocks are in place
import { isOptedIn, trackEvent } from "../telemetry";
import { readCtokConfig } from "@ctok/quota";

const mockRead = readCtokConfig as ReturnType<typeof vi.fn>;

describe("isOptedIn", () => {
  beforeEach(() => {
    delete process.env["CTOK_TELEMETRY"];
    mockRead.mockReturnValue(undefined);
  });

  afterEach(() => {
    delete process.env["CTOK_TELEMETRY"];
  });

  it("returns false by default (no config, no env)", () => {
    expect(isOptedIn()).toBe(false);
  });

  it("returns true when config key is boolean true", () => {
    mockRead.mockReturnValue(true);
    expect(isOptedIn()).toBe(true);
  });

  it("returns true when config key is string 'true'", () => {
    mockRead.mockReturnValue("true");
    expect(isOptedIn()).toBe(true);
  });

  it("returns false when config key is false", () => {
    mockRead.mockReturnValue(false);
    expect(isOptedIn()).toBe(false);
  });

  it("CTOK_TELEMETRY=1 env var overrides config (enables)", () => {
    mockRead.mockReturnValue(false);
    process.env["CTOK_TELEMETRY"] = "1";
    expect(isOptedIn()).toBe(true);
  });

  it("CTOK_TELEMETRY=0 env var overrides config (disables)", () => {
    mockRead.mockReturnValue(true);
    process.env["CTOK_TELEMETRY"] = "0";
    expect(isOptedIn()).toBe(false);
  });

  it("readCtokConfig throwing returns false gracefully", () => {
    mockRead.mockImplementation(() => { throw new Error("fs error"); });
    expect(isOptedIn()).toBe(false);
  });
});

describe("trackEvent", () => {
  beforeEach(() => {
    delete process.env["CTOK_TELEMETRY"];
    mockRead.mockReturnValue(undefined);
  });

  afterEach(() => {
    delete process.env["CTOK_TELEMETRY"];
  });

  it("does not throw when opt-ed out (default)", () => {
    expect(() => trackEvent("check")).not.toThrow();
  });

  it("does not throw when opt-ed in (even if network unavailable)", () => {
    process.env["CTOK_TELEMETRY"] = "1";
    // Network will fail in test environment - should be swallowed silently
    expect(() => trackEvent("check", { json: false })).not.toThrow();
  });

  it("does not throw with arbitrary props", () => {
    process.env["CTOK_TELEMETRY"] = "1";
    expect(() => trackEvent("scan", { json: true, count: 42, flag: false })).not.toThrow();
  });
});
