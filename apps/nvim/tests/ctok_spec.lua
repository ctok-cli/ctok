--- Tests for ctok.nvim using plenary.nvim busted runner.
--- Run with: nvim --headless -c "PlenaryBustedDirectory tests/ {minimal_init='tests/minimal_init.lua'}"

local assert = require("luassert")
local format = require("ctok.format")
local config = require("ctok.config")

describe("ctok.config", function()
  it("setup merges user opts with defaults", function()
    config.setup({ executable = "/custom/ctok", win_width = 0.8 })
    assert.equals("/custom/ctok", config.current.executable)
    assert.equals(0.8, config.current.win_width)
    -- defaults still present for unset keys
    assert.equals("rounded", config.current.border)
  end)

  it("setup with nil uses all defaults", function()
    config.setup(nil)
    assert.equals("ctok", config.current.executable)
    assert.equals(0.6, config.current.win_width)
    assert.equals(0.7, config.current.win_height)
    assert.is_true(config.current.auto_commands)
  end)
end)

describe("ctok.format.check_lines", function()
  local function make_check_result(with_suggestions)
    return {
      estimate = {
        input = { min = 100, expected = 150, max = 200, confidence = "high" },
        output = { min = 50, expected = 100, max = 200 },
        confidence = "high",
      },
      cost = {
        inputUsd = 0.0001,
        outputUsd = 0.0002,
        totalUsd = 0.0003,
        totalUsdRange = { min = 0.0001, max = 0.0005 },
      },
      recommendation = {
        effort = { effort = "medium", reason = "Moderate complexity" },
        model = { model = "claude-haiku-4-5", reason = "Short prompt" },
      },
      suggestions = with_suggestions and {
        { title = "Use shorter variable names", detail = "Replace verbose names", severity = "info" },
      } or {},
    }
  end

  it("contains key sections", function()
    local lines = format.check_lines(make_check_result(false))
    local joined = table.concat(lines, "\n")
    assert.truthy(joined:find("Token Estimate"))
    assert.truthy(joined:find("Input:"))
    assert.truthy(joined:find("Output:"))
    assert.truthy(joined:find("Cost:"))
    assert.truthy(joined:find("Effort:"))
    assert.truthy(joined:find("Model:"))
  end)

  it("includes suggestions when present", function()
    local lines = format.check_lines(make_check_result(true))
    local joined = table.concat(lines, "\n")
    assert.truthy(joined:find("Suggestions:"))
    assert.truthy(joined:find("Use shorter variable names"))
  end)

  it("omits suggestions section when empty", function()
    local lines = format.check_lines(make_check_result(false))
    local joined = table.concat(lines, "\n")
    assert.falsy(joined:find("Suggestions:"))
  end)

  it("formats token counts", function()
    local result = make_check_result(false)
    result.estimate.input.expected = 1500
    local lines = format.check_lines(result)
    local joined = table.concat(lines, "\n")
    assert.truthy(joined:find("1.5k"))
  end)
end)

describe("ctok.format.refine_lines", function()
  it("contains refined text and savings", function()
    local result = {
      refined = "Fix the auth bug.",
      savedTokens = 12,
      savedPct = 30.0,
      passes = { { name = "filler-strip", saved = 12 } },
      specificityScore = 80,
      specificityBefore = 40,
    }
    local lines = format.refine_lines(result)
    local joined = table.concat(lines, "\n")
    assert.truthy(joined:find("Refined Prompt"))
    assert.truthy(joined:find("Fix the auth bug%."))
    assert.truthy(joined:find("12"))
    assert.truthy(joined:find("30"))
    assert.truthy(joined:find("filler%-strip"))
    assert.truthy(joined:find("80/100"))
  end)
end)

describe("ctok.format.scan_lines", function()
  it("contains scan summary", function()
    local result = {
      root = "/home/user/myproject",
      projectType = "node",
      totalFiles = 42,
      estimatedTokens = 15000,
      byExtension = {
        [".ts"] = { files = 20, tokens = 10000 },
        [".json"] = { files = 5, tokens = 500 },
      },
      topHeavyFiles = {
        { path = "src/big.ts", tokens = 3000 },
      },
      excluded = { files = 100, tokens = 50000 },
    }
    local lines = format.scan_lines(result)
    local joined = table.concat(lines, "\n")
    assert.truthy(joined:find("Project Scan"))
    assert.truthy(joined:find("myproject"))
    assert.truthy(joined:find("node"))
    assert.truthy(joined:find("42"))
    assert.truthy(joined:find("15%.0k"))
    assert.truthy(joined:find("%.ts"))
    assert.truthy(joined:find("big%.ts"))
    assert.truthy(joined:find("Excluded:"))
  end)
end)

describe("ctok.format token formatting", function()
  -- Test via check_lines with various token counts

  it("formats small numbers as-is", function()
    local result = {
      estimate = { input = { min = 500, expected = 500, max = 500 }, output = { min = 0, expected = 0, max = 0 }, confidence = "high" },
      cost = { inputUsd = 0, outputUsd = 0, totalUsd = 0, totalUsdRange = { min = 0, max = 0 } },
      recommendation = { effort = { effort = "low" }, model = { model = "claude-haiku-4-5" } },
      suggestions = {},
    }
    local lines = format.check_lines(result)
    local joined = table.concat(lines, "\n")
    assert.truthy(joined:find("500"))
    -- should NOT contain k suffix for 500
    assert.falsy(joined:find("500k"))
  end)

  it("formats millions", function()
    local result = {
      estimate = { input = { min = 1500000, expected = 1500000, max = 1500000 }, output = { min = 0, expected = 0, max = 0 }, confidence = "high" },
      cost = { inputUsd = 0, outputUsd = 0, totalUsd = 0, totalUsdRange = { min = 0, max = 0 } },
      recommendation = { effort = { effort = "xhigh" }, model = { model = "claude-opus-4-7" } },
      suggestions = {},
    }
    local lines = format.check_lines(result)
    local joined = table.concat(lines, "\n")
    assert.truthy(joined:find("1%.5M"))
  end)
end)
