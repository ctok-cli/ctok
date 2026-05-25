--- Default configuration for ctok.nvim
local M = {}

---@class CtokConfig
---@field executable string Path to ctok binary (default: "ctok" on PATH)
---@field win_width number Float window width as fraction of editor (default: 0.6)
---@field win_height number Float window height as fraction of editor (default: 0.7)
---@field border string|table Float window border style (default: "rounded")
---@field keymaps table<string, string> Command → keymap (default: none)
---@field auto_commands boolean Register :Ctok* user commands on setup (default: true)

---@type CtokConfig
M.defaults = {
  executable = "ctok",
  win_width = 0.6,
  win_height = 0.7,
  border = "rounded",
  keymaps = {},
  auto_commands = true,
}

---@type CtokConfig
M.current = {}

--- Merge user opts into defaults and store in M.current.
---@param opts CtokConfig|nil
function M.setup(opts)
  M.current = vim.tbl_deep_extend("force", M.defaults, opts or {})
end

return M
