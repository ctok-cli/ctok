--- Floating window UI for ctok results.
local M = {}
local config = require("ctok.config")

-- Track the open float so we can close/reuse it.
local state = { buf = nil, win = nil }

--- Create a scratch buffer pre-filled with lines.
---@param lines string[]
---@return integer bufnr
local function make_buf(lines)
  local buf = vim.api.nvim_create_buf(false, true)
  vim.api.nvim_buf_set_lines(buf, 0, -1, false, lines)
  vim.bo[buf].modifiable = false
  vim.bo[buf].filetype = "ctok"
  -- Highlight patterns
  vim.api.nvim_buf_call(buf, function()
    vim.cmd("syntax match CtokHeader /^[╭╰│].*/ ")
    vim.cmd("syntax match CtokKey /^  [A-Z][a-zA-Z ]*:/")
    vim.cmd("syntax match CtokBullet /^  •/")
    vim.cmd("highlight default link CtokHeader Comment")
    vim.cmd("highlight default link CtokKey Identifier")
    vim.cmd("highlight default link CtokBullet Special")
  end)
  return buf
end

--- Open (or reuse) the float window.
---@param lines string[]
---@param title string
function M.open(lines, title)
  -- Close stale window
  if state.win and vim.api.nvim_win_is_valid(state.win) then
    vim.api.nvim_win_close(state.win, true)
  end
  if state.buf and vim.api.nvim_buf_is_valid(state.buf) then
    vim.api.nvim_buf_delete(state.buf, { force = true })
  end

  local cfg = config.current
  local editor_w = vim.o.columns
  local editor_h = vim.o.lines

  local width = math.max(60, math.floor(editor_w * (cfg.win_width or 0.6)))
  local height = math.max(10, math.floor(editor_h * (cfg.win_height or 0.7)))
  local row = math.floor((editor_h - height) / 2)
  local col = math.floor((editor_w - width) / 2)

  local buf = make_buf(lines)
  local win = vim.api.nvim_open_win(buf, true, {
    relative = "editor",
    row = row,
    col = col,
    width = width,
    height = height,
    style = "minimal",
    border = cfg.border or "rounded",
    title = " " .. title .. " ",
    title_pos = "center",
  })

  state.buf = buf
  state.win = win

  -- Close on q / <Esc>
  for _, key in ipairs({ "q", "<Esc>" }) do
    vim.keymap.set("n", key, function()
      if vim.api.nvim_win_is_valid(win) then
        vim.api.nvim_win_close(win, true)
      end
    end, { buffer = buf, silent = true })
  end
end

--- Show an error notification.
---@param msg string
function M.error(msg)
  vim.notify("[ctok] " .. msg, vim.log.levels.ERROR)
end

--- Show a loading spinner notification.
---@param msg string
function M.info(msg)
  vim.notify("[ctok] " .. msg, vim.log.levels.INFO)
end

return M
