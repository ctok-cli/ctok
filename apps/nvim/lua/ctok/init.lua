--- ctok.nvim — Claude token estimator for Neovim
--- Entry point: require('ctok').setup(opts)
local M = {}

local config = require("ctok.config")
local cli = require("ctok.cli")
local format = require("ctok.format")
local ui = require("ctok.ui")

--- Get the visual selection text (works in visual + visual-line modes).
---@return string|nil
local function get_visual_selection()
  local start_pos = vim.fn.getpos("'<")
  local end_pos = vim.fn.getpos("'>")
  local lines = vim.api.nvim_buf_get_lines(0, start_pos[2] - 1, end_pos[2], false)
  if #lines == 0 then return nil end
  -- Trim to column selection on single line
  if #lines == 1 then
    lines[1] = lines[1]:sub(start_pos[3], end_pos[3])
  else
    lines[1] = lines[1]:sub(start_pos[3])
    lines[#lines] = lines[#lines]:sub(1, end_pos[3])
  end
  return table.concat(lines, "\n")
end

--- Get the full buffer content as a string.
---@return string
local function get_buffer_text()
  local lines = vim.api.nvim_buf_get_lines(0, 0, -1, false)
  return table.concat(lines, "\n")
end

--- Run :CtokCheck — estimate tokens for visual selection or full buffer.
---@param opts { range: integer, args: string }
function M.check(opts)
  local text
  if opts.range > 0 then
    text = get_visual_selection()
  end
  if not text or text == "" then
    text = get_buffer_text()
  end
  if text == "" then
    ui.error("Buffer is empty.")
    return
  end

  -- Parse optional --model flag from command args
  local model = opts.args and opts.args:match("--model%s+(%S+)")

  ui.info("Estimating tokens…")
  vim.schedule(function()
    local result, err = cli.check(text, { model = model })
    if err then
      ui.error(err)
      return
    end
    local lines = format.check_lines(result)
    ui.open(lines, "ctok check")
  end)
end

--- Run :CtokRefine — refine the visual selection.
---@param opts { range: integer }
function M.refine(opts)
  local text
  if opts.range > 0 then
    text = get_visual_selection()
  end
  if not text or text == "" then
    text = get_buffer_text()
  end
  if text == "" then
    ui.error("Buffer is empty.")
    return
  end

  ui.info("Refining prompt…")
  vim.schedule(function()
    local result, err = cli.refine(text)
    if err then
      ui.error(err)
      return
    end
    local lines = format.refine_lines(result)
    ui.open(lines, "ctok refine")
  end)
end

--- Run :CtokScan — scan the project root.
---@param opts { args: string }
function M.scan(opts)
  local dir = (opts.args and opts.args ~= "") and opts.args
    or vim.fn.getcwd()

  ui.info("Scanning " .. dir .. "…")
  vim.schedule(function()
    local result, err = cli.scan(dir)
    if err then
      ui.error(err)
      return
    end
    local lines = format.scan_lines(result)
    ui.open(lines, "ctok scan")
  end)
end

--- Replace visual selection with the refined text.
---@param opts { range: integer }
function M.refine_replace(opts)
  if opts.range == 0 then
    ui.error(":CtokRefineReplace requires a visual selection.")
    return
  end
  local text = get_visual_selection()
  if not text or text == "" then
    ui.error("Selection is empty.")
    return
  end

  ui.info("Refining and replacing selection…")
  local start_pos = vim.fn.getpos("'<")
  local end_pos = vim.fn.getpos("'>")

  vim.schedule(function()
    local result, err = cli.refine(text)
    if err then
      ui.error(err)
      return
    end
    local refined = result.refined or text
    local replacement = vim.split(refined, "\n", { plain = true })
    vim.api.nvim_buf_set_lines(0, start_pos[2] - 1, end_pos[2], false, replacement)
    vim.notify(string.format("[ctok] Replaced: saved %d tokens (%.0f%%)",
      result.savedTokens or 0, result.savedPct or 0), vim.log.levels.INFO)
  end)
end

--- Check if ctok is installed and show the path.
function M.doctor()
  local exe, err = cli.find_executable()
  if err then
    ui.error(err)
    return
  end
  local r = cli.run({ "--version" })
  local version = r.stdout:match("([%d%.]+)") or "unknown"
  vim.notify(string.format("[ctok] %s (v%s) — ready", exe, version), vim.log.levels.INFO)
end

--- Setup function — call once in your Neovim config.
---@param opts CtokConfig|nil
function M.setup(opts)
  config.setup(opts)

  if not config.current.auto_commands then return end

  -- User commands
  vim.api.nvim_create_user_command("CtokCheck", function(o)
    M.check(o)
  end, { range = true, nargs = "?", desc = "ctok: estimate tokens for selection/buffer" })

  vim.api.nvim_create_user_command("CtokRefine", function(o)
    M.refine(o)
  end, { range = true, desc = "ctok: refine prompt — show results in float" })

  vim.api.nvim_create_user_command("CtokRefineReplace", function(o)
    M.refine_replace(o)
  end, { range = true, desc = "ctok: refine selection and replace in-place" })

  vim.api.nvim_create_user_command("CtokScan", function(o)
    M.scan(o)
  end, { nargs = "?", desc = "ctok: scan project directory" })

  vim.api.nvim_create_user_command("CtokDoctor", function(_)
    M.doctor()
  end, { desc = "ctok: check installation" })

  -- Register user-defined keymaps
  for cmd, lhs in pairs(config.current.keymaps or {}) do
    local rhs = "<cmd>" .. cmd .. "<cr>"
    vim.keymap.set({ "n", "v" }, lhs, rhs, { desc = "ctok: " .. cmd, silent = true })
  end
end

return M
