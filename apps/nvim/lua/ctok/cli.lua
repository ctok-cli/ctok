--- CLI runner: wraps the ctok binary using vim.system (Neovim 0.10+).
local M = {}
local config = require("ctok.config")

--- Find the ctok executable, respecting config.executable.
---@return string|nil path, string|nil error
function M.find_executable()
  local exe = config.current.executable or "ctok"
  if vim.fn.executable(exe) == 1 then
    return exe, nil
  end
  -- Common install paths
  for _, candidate in ipairs({ "/usr/local/bin/ctok", "/opt/homebrew/bin/ctok", vim.fn.expand("~/.ctok/bin/ctok") }) do
    if vim.fn.executable(candidate) == 1 then
      return candidate, nil
    end
  end
  return nil, "ctok not found. Install via: npm i -g @ctok/cli"
end

--- Run a ctok command synchronously.
---@param args string[] CLI arguments (e.g. {"check", "--json", "<prompt>"})
---@param stdin string|nil Optional stdin text
---@return { ok: boolean, stdout: string, stderr: string, code: integer }
function M.run(args, stdin)
  local exe, err = M.find_executable()
  if not exe then
    return { ok = false, stdout = "", stderr = err or "ctok not found", code = 1 }
  end

  local cmd = vim.list_extend({ exe }, args)
  local result = vim.system(cmd, {
    stdin = stdin,
    text = true,
    timeout = 30000,
  }):wait()

  return {
    ok = result.code == 0,
    stdout = result.stdout or "",
    stderr = result.stderr or "",
    code = result.code,
  }
end

--- Run ctok check --json on text.
---@param text string
---@param opts { model?: string }|nil
---@return table|nil parsed, string|nil error
function M.check(text, opts)
  opts = opts or {}
  local args = { "check", "--json" }
  if opts.model then
    vim.list_extend(args, { "--model", opts.model })
  end
  vim.list_extend(args, { text })

  local r = M.run(args)
  if not r.ok then
    return nil, r.stderr ~= "" and r.stderr or ("ctok exited with code " .. r.code)
  end

  local ok, parsed = pcall(vim.json.decode, r.stdout)
  if not ok then
    return nil, "Failed to parse ctok output: " .. tostring(parsed)
  end
  return parsed, nil
end

--- Run ctok refine --json on text.
---@param text string
---@return table|nil parsed, string|nil error
function M.refine(text)
  local r = M.run({ "refine", "--json", text })
  if not r.ok then
    return nil, r.stderr ~= "" and r.stderr or ("ctok exited with code " .. r.code)
  end

  local ok, parsed = pcall(vim.json.decode, r.stdout)
  if not ok then
    return nil, "Failed to parse ctok output: " .. tostring(parsed)
  end
  return parsed, nil
end

--- Run ctok scan --json on a directory.
---@param dir string
---@return table|nil parsed, string|nil error
function M.scan(dir)
  local r = M.run({ "scan", "--json", dir })
  if not r.ok then
    return nil, r.stderr ~= "" and r.stderr or ("ctok exited with code " .. r.code)
  end

  local ok, parsed = pcall(vim.json.decode, r.stdout)
  if not ok then
    return nil, "Failed to parse ctok output: " .. tostring(parsed)
  end
  return parsed, nil
end

return M
