-- luacheck config for ctok.nvim
std = "lua51"
globals = { "vim" }
ignore = {
  "212", -- unused argument (common in callbacks)
  "631", -- line too long (let the formatter handle it)
}
files["tests/"] = {
  globals = { "describe", "it", "before_each", "after_each", "assert", "require" }
}
