# ctok.nvim

Neovim plugin for [ctok](https://github.com/yourusername/ctok) — Claude token estimator.

Estimate token counts, get model recommendations, and refine prompts without leaving Neovim. All work is delegated to the `ctok` CLI; this plugin is a thin Lua wrapper.

## Requirements

- Neovim **0.10+** (uses `vim.system`)
- `ctok` CLI: `npm i -g @ctok/cli`

## Installation

**lazy.nvim**
```lua
{
  "ctok-cli/ctok.nvim",
  config = function()
    require("ctok").setup()
  end,
}
```

**packer.nvim**
```lua
use {
  "ctok-cli/ctok.nvim",
  config = function() require("ctok").setup() end,
}
```

## Usage

| Command | Description |
|---|---|
| `:[range]CtokCheck` | Estimate tokens for selection or full buffer |
| `:[range]CtokRefine` | Refine prompt — show result in float |
| `:[range]CtokRefineReplace` | Refine and replace selection in-place |
| `:CtokScan [dir]` | Scan project directory |
| `:CtokDoctor` | Verify installation |

All floating windows close with `q` or `<Esc>`.

## Configuration

```lua
require("ctok").setup({
  executable  = "ctok",       -- path to binary; default: "ctok" on $PATH
  win_width   = 0.6,          -- float width  (fraction of editor)
  win_height  = 0.7,          -- float height (fraction of editor)
  border      = "rounded",    -- nvim_open_win border style
  keymaps     = {             -- optional: command → key
    CtokCheck         = "<leader>tk",
    CtokRefine        = "<leader>tr",
    CtokRefineReplace = "<leader>tR",
    CtokScan          = "<leader>ts",
  },
  auto_commands = true,       -- register :Ctok* commands automatically
})
```

## Examples

Estimate the current buffer:
```
:CtokCheck
```

Estimate with a specific model override:
```
:CtokCheck --model claude-opus-4-7
```

Visual-select a prompt, then refine and replace it:
```
V{select lines}<Enter>:CtokRefineReplace
```

Scan a specific directory:
```
:CtokScan ~/projects/myapp
```

## License

MIT
