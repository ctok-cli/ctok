--- Format ctok JSON results into human-readable lines for display.
local M = {}

--- Format a token number as "500", "1.5k", "1.5M".
---@param n number
---@return string
local function fmt_tokens(n)
  if n >= 1e6 then
    return string.format("%.1fM", n / 1e6)
  elseif n >= 1000 then
    return string.format("%.1fk", n / 1000)
  end
  return tostring(n)
end

--- Format a USD amount.
---@param v number
---@return string
local function fmt_usd(v)
  if v < 0.01 then
    return string.format("$%.4f", v)
  end
  return string.format("$%.2f", v)
end

--- Effort level → label with indicator.
---@param effort string
---@return string
local function effort_label(effort)
  local map = { low = "🟢 Low", medium = "🟡 Medium", high = "🟠 High", xhigh = "🔴 X-High" }
  return map[effort] or ("⚪ " .. (effort or "?"))
end

--- Format check result into display lines.
---@param result table Parsed JSON from ctok check --json
---@return string[]
function M.check_lines(result)
  local lines = {}
  local function push(line) table.insert(lines, line or "") end

  push("╭─ Token Estimate ─────────────────────────────────╮")
  push("")

  local est = result.estimate or {}
  local inp = est.input or {}
  local out = est.output or {}
  push(string.format("  Input:    %s  (range %s – %s)",
    fmt_tokens(inp.expected or 0), fmt_tokens(inp.min or 0), fmt_tokens(inp.max or 0)))
  push(string.format("  Output:   %s  (range %s – %s)",
    fmt_tokens(out.expected or 0), fmt_tokens(out.min or 0), fmt_tokens(out.max or 0)))
  push(string.format("  Confidence: %s", est.confidence or "?"))
  push("")

  local cost = result.cost or {}
  push(string.format("  Cost:     %s  (range %s – %s)",
    fmt_usd(cost.totalUsd or 0),
    fmt_usd((cost.totalUsdRange or {}).min or 0),
    fmt_usd((cost.totalUsdRange or {}).max or 0)))
  push(string.format("  Input:    %s   Output: %s",
    fmt_usd(cost.inputUsd or 0), fmt_usd(cost.outputUsd or 0)))
  push("")

  local rec = result.recommendation or {}
  local effort = (rec.effort or {}).effort or "?"
  local model = (rec.model or {}).model or "?"
  push(string.format("  Effort:   %s", effort_label(effort)))
  push(string.format("  Model:    %s", model))
  if (rec.effort or {}).reason then
    push(string.format("  Why:      %s", rec.effort.reason))
  end
  if (rec.model or {}).reason then
    push(string.format("            %s", rec.model.reason))
  end
  push("")

  local suggestions = result.suggestions or {}
  if #suggestions > 0 then
    push("  Suggestions:")
    for _, s in ipairs(suggestions) do
      push(string.format("  • [%s] %s", s.severity or "info", s.title or ""))
      if s.detail and s.detail ~= "" then
        push(string.format("    %s", s.detail))
      end
    end
    push("")
  end

  push("╰──────────────────────────────────────────────────╯")
  return lines
end

--- Format refine result into display lines.
---@param result table Parsed JSON from ctok refine --json
---@return string[]
function M.refine_lines(result)
  local lines = {}
  local function push(line) table.insert(lines, line or "") end

  push("╭─ Refined Prompt ─────────────────────────────────╮")
  push("")
  push(string.format("  Saved: %d tokens  (%.0f%%)",
    result.savedTokens or 0, result.savedPct or 0))
  push("")
  push("  ─ Refined ─")
  push("")
  for part in (result.refined or ""):gmatch("[^\n]+") do
    push("  " .. part)
  end
  push("")
  push("  ─ Passes Applied ─")
  local passes = result.passes or {}
  if #passes > 0 then
    for _, p in ipairs(passes) do
      if (p.saved or 0) > 0 then
        push(string.format("  • %-26s −%d tokens", p.name or "?", p.saved))
      end
    end
  else
    push("  (none)")
  end
  if result.specificityScore then
    push("")
    push(string.format("  Specificity: %d/100  →  %d/100",
      result.specificityBefore or 0, result.specificityScore))
  end
  push("")
  push("╰──────────────────────────────────────────────────╯")
  return lines
end

--- Format scan result into display lines.
---@param result table Parsed JSON from ctok scan --json
---@return string[]
function M.scan_lines(result)
  local lines = {}
  local function push(line) table.insert(lines, line or "") end

  push("╭─ Project Scan ───────────────────────────────────╮")
  push("")
  push(string.format("  Root:    %s", result.root or "."))
  push(string.format("  Type:    %s", result.projectType or "unknown"))
  push(string.format("  Files:   %d  (%s estimated tokens)",
    result.totalFiles or 0, fmt_tokens(result.estimatedTokens or 0)))
  push("")

  local by_ext = result.byExtension or {}
  local exts = {}
  for ext, data in pairs(by_ext) do
    table.insert(exts, { ext = ext, tokens = data.tokens or 0, files = data.files or 0 })
  end
  table.sort(exts, function(a, b) return a.tokens > b.tokens end)

  if #exts > 0 then
    push("  By extension:")
    for i, e in ipairs(exts) do
      if i > 10 then break end
      push(string.format("  %-12s %4d files   %s tokens",
        e.ext, e.files, fmt_tokens(e.tokens)))
    end
    push("")
  end

  local heavy = result.topHeavyFiles or {}
  if #heavy > 0 then
    push("  Heaviest files:")
    for i, f in ipairs(heavy) do
      if i > 8 then break end
      local short = f.path or ""
      if #short > 50 then short = "…" .. short:sub(-49) end
      push(string.format("  %-52s %s", short, fmt_tokens(f.tokens or 0)))
    end
    push("")
  end

  local excl = result.excluded or {}
  if (excl.files or 0) > 0 then
    push(string.format("  Excluded: %d files  (%s tokens saved)",
      excl.files, fmt_tokens(excl.tokens or 0)))
    push("")
  end

  push("╰──────────────────────────────────────────────────╯")
  return lines
end

return M
