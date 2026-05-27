--- Minimal Neovim init for running tests with plenary.nvim.
--- Usage:
---   nvim --headless -c "PlenaryBustedDirectory tests/ {minimal_init='tests/minimal_init.lua'}"

local root = vim.fn.fnamemodify(debug.getinfo(1, "S").source:sub(2), ":h:h")

-- Add the plugin runtime path
vim.opt.rtp:prepend(root)

-- Add plenary - adjust path to where plenary is installed on your system,
-- or use a plugin manager that handles this.
-- For CI we install it via the workflow.
local plenary_path = vim.fn.stdpath("data") .. "/lazy/plenary.nvim"
if vim.fn.isdirectory(plenary_path) == 1 then
  vim.opt.rtp:prepend(plenary_path)
end

-- Suppress UI noise during headless tests
vim.o.swapfile = false
vim.o.backup = false
