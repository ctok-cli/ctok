# ctok - How to use it

> **Lighthouse for Claude prompts.** Estimate tokens, recommend models, and refine prompts before you send them - across CLI, web, desktop, browser, IDE, chat, and CI.

Every surface uses the same engine (`@ctok/core`, `@ctok/refiner`, `@ctok/scanner`, `@ctok/quota`). What you learn in the CLI transfers to every other shell.

---

## Table of contents

1. [Three jobs](#three-jobs)
2. [Install the CLI](#install-the-cli)
3. [CLI walkthrough](#cli-walkthrough)
4. [MCP server (Claude Code, Cursor, Zed)](#mcp-server)
5. [Web playground](#web-playground)
6. [Desktop app](#desktop-app)
7. [Browser extension](#browser-extension)
8. [VS Code extension](#vs-code-extension)
9. [JetBrains plugin](#jetbrains-plugin-preview)
10. [Slack bot](#slack-bot)
11. [Discord bot](#discord-bot)
12. [Raycast extension](#raycast-extension)
13. [Neovim plugin (preview)](#neovim-plugin-preview)
14. [Zed extension (preview)](#zed-extension-preview)
15. [Xcode source extension (preview)](#xcode-source-extension-preview)
16. [GitHub Action](#github-action)
17. [Configuration](#configuration)
18. [Privacy](#privacy)
19. [Troubleshooting](#troubleshooting)
20. [Uninstall](#uninstall)

---

## Three jobs

Every surface answers three questions:

| Job | Question | Command |
|---|---|---|
| **Estimate** | How many tokens will this prompt use? What will it cost? | `ctok check` |
| **Recommend** | Which model + effort gives me the best ROI? | `ctok model` |
| **Refine** | Can my prompt be tighter, clearer, cheaper? | `ctok refine` |

Plus a project view: `ctok scan` shows where the tokens in your repo live and what to ignore.

---

## Install the CLI

### npm / pnpm / yarn

```sh
npm install -g @ctok/cli
# or
pnpm add -g @ctok/cli
# or
yarn global add @ctok/cli
```

### Homebrew (macOS / Linux)

```sh
brew install ctok-cli/tap/ctok
```

### Scoop (Windows)

```powershell
scoop bucket add ctok https://github.com/ctok-cli/scoop-ctok
scoop install ctok
```

### winget (Windows)

```powershell
winget install ctok-cli.ctok
```

### One-liner installers

```sh
# Linux / macOS
curl -fsSL https://ctok-cli.github.io/ctok/install.sh | sh

# Windows PowerShell
irm https://ctok-cli.github.io/ctok/install.ps1 | iex
```

### Verify

```sh
ctok --version
ctok doctor
```

`ctok doctor` checks Node version, plan configuration, Claude home detection, and prints what to fix.

---

## CLI walkthrough

Every command supports `--json`, `--quiet`, and `--no-color`.

### `ctok` - interactive REPL

```sh
ctok
```

Drops you into a REPL. Type a prompt, press Enter, get a full report. Type `:help` for commands, `:scan` to scan the cwd, `:exit` to leave.

### `ctok check` - estimate a prompt

```sh
# Inline prompt
ctok check "Refactor the auth module to use JWT"

# From a file
ctok check -f prompt.md

# Pipe from stdin
cat prompt.md | ctok check -

# Override model
ctok check "..." -m claude-opus-4-7

# JSON for piping
ctok check "..." --json | jq .cost.totalUsd
```

Output includes input/output token ranges with confidence, USD cost range, recommended model + effort, reduction suggestions, and quota impact for your configured plan.

### `ctok refine` - tighten a prompt

```sh
ctok refine "please can you kindly help me handle the auth thing somehow"
```

Runs the 7-pass heuristic pipeline (filler strip, vague verb replacement, structure scaffold, dedup, file-ref compression, output-format hint, negative-collapse) and prints the refined prompt plus what changed.

#### The killer view: `--diff`

```sh
ctok refine --diff "<prompt>"
```

Shows a **side-by-side coloured diff** and a **specificity scorecard**:

```
Original                                │ Refined
────────────────────────────────────────┼────────────────────────────────────────
please can you kindly help me handle    │ Refactor the auth flow to use JWT
the auth thing somehow                  │ validation; return only the diff.

Specificity 22/100 → 78/100 ▲ +56  •  saved ~9 tokens (38%)
```

This is the screenshot you share.

#### LLM mode (optional, paid path)

```sh
ctok refine --llm "..."                  # uses ANTHROPIC_API_KEY
ctok refine --llm --llm-model sonnet-4-6 "..."
ctok refine --llm --api-key sk-ant-... "..."
```

Calls Claude through the AI SDK / Vercel AI Gateway for semantic refinement. Use only when heuristics aren't enough - costs real money.

### `ctok scan` - see where tokens live in your project

```sh
ctok scan                # scan cwd
ctok scan ./apps/web     # specific directory
ctok scan --top 25       # top 25 heavy files
ctok scan --json         # machine-readable
```

Auto-detects the project type (Node, Flutter, iOS, Android, Rust, Go, Python, Ruby, PHP, JVM, Swift, .NET, Elixir) and applies sensible excludes. Respects `.gitignore` and `.ctokignore`.

### `ctok model` - pick the right model

```sh
ctok model "Add an OAuth2 PKCE flow with refresh tokens"
```

Prints the recommended model + effort with reasoning, plus alternatives.

### `ctok serve` - local web UI

```sh
ctok serve              # http://localhost:31337
ctok serve --port 8080
```

Launches the same UI you see at [ctok-cli.github.io/ctok/playground](https://ctok-cli.github.io/ctok/playground/) bound to localhost.

### `ctok history` - recent estimations

```sh
ctok history            # last 20
ctok history -n 50      # last 50
ctok history --csv      # export
ctok history --clear    # wipe local history
```

### `ctok diff <id1> <id2>` - compare two estimations

```sh
ctok diff sess_2k3l sess_5x9m
```

### `ctok config` - settings

```sh
ctok config                       # show all
ctok config set plan max20x       # free | pro | max5x | max20x | team | enterprise | api
ctok config set telemetry true
ctok config get plan
ctok config edit                  # open in $EDITOR
```

Config lives at `~/.ctok/config.json`. Plan auto-detects from `~/.claude/settings.json` if present.

### `ctok init` - scaffold project files

```sh
ctok init             # writes .ctokignore + CLAUDE.md template
ctok init --force     # overwrite
```

### `ctok doctor` - diagnose

```sh
ctok doctor
```

Verifies Node version, config files, Claude home detection, and prints actionable hints.

---

## MCP server

`@ctok/mcp` is a JSON-RPC 2.0 stdio server exposing four tools to any MCP client (Claude Code, Cursor, Zed, Claude Desktop, …).

### Add to Claude Code

```json
{
  "mcpServers": {
    "ctok": {
      "command": "npx",
      "args": ["-y", "@ctok/mcp"]
    }
  }
}
```

Then restart Claude Code. Ask: *"estimate tokens for this prompt"*.

### Tools exposed

| Tool | Purpose |
|---|---|
| `estimate` | tokens, cost, model recommendation for a prompt |
| `refine` | heuristic refinement + before/after specificity |
| `recommend_model` | best model + effort for a prompt |
| `scan_project` | token map of a directory |

### Same config works for Cursor and Zed

Cursor: `~/.cursor/mcp.json`. Zed: `~/.config/zed/settings.json` under `context_servers`.

---

## Web playground

[**ctok-cli.github.io/ctok/playground**](https://ctok-cli.github.io/ctok/playground/) - paste a prompt, paste pasted-code blocks, optionally a project-context blob, get the full report.

- Shareable links: state encodes into the URL hash (`ctok-cli.github.io/ctok/playground/#<hash>`). Copy the URL to share an analysis.
- Local-only history (your browser).
- No upload - text never leaves your tab unless you click *Share*.

Run it locally too with `ctok serve`.

---

## Desktop app

Download the signed installer from [Releases](https://github.com/ctok-cli/ctok/releases):

- Windows: `ctok_x.y.z_x64.msi`
- macOS: `ctok_x.y.z_universal.dmg`
- Linux: `ctok_x.y.z_amd64.deb` / `.AppImage` / `.rpm`

Drag-drop a project folder onto the window - it scans natively (Rust scanner inside Tauri) and shows token distribution, heavy files, and exclusions.

Auto-updates via the in-app updater.

---

## Browser extension

Chrome / Edge / Firefox / Brave. Live token overlay on:

- claude.ai
- chatgpt.com (and chat.openai.com)
- cursor.com
- chat.deepseek.com
- gemini.google.com

Installs:

- [Chrome Web Store](https://chrome.google.com/webstore) - search "ctok"
- [Edge Add-ons](https://microsoftedge.microsoft.com/addons)
- [Firefox AMO](https://addons.mozilla.org)

Click the floating widget for the full refine view. **Zero network calls** - everything happens in your tab.

---

## VS Code extension

Install: search "ctok" in the Extensions panel, or:

```sh
code --install-extension ctok-cli.ctok-vscode
```

Commands (⇧⌘P / Ctrl+Shift+P):

- **ctok: Estimate selection** - highlight a prompt, run.
- **ctok: Refine selection** - runs the refiner and shows the diff in a side panel.
- **ctok: Scan workspace** - token map of the current folder.
- **ctok: Open web playground** - opens ctok-cli.github.io/ctok/playground with current selection as a hash link.

Status-bar pill shows token count of the current file when ctok is active.

---

## JetBrains plugin (preview)

IntelliJ, WebStorm, PyCharm, Android Studio, GoLand, Rider, RubyMine, AppCode.

Install from the JetBrains Marketplace ("ctok"). Tool Window → ctok → paste prompt → see estimate.

> Status: **Preview**. The plugin shells out to the bundled `@ctok/cli` Node binary. Make sure Node 20+ is on `PATH` or set *Preferences → Tools → ctok → Node path*.

---

## Slack bot

Add to your workspace: `https://ctok-cli.github.io/ctok/slack/install`.

Slash commands:

```
/ctok check <prompt>
/ctok refine <prompt>
/ctok score <prompt>
```

Returns a Slack message with the report. Bot text stays inside your workspace; no logs of prompts.

Self-host: `apps/slack/` has the bot code. `pnpm -F @ctok/slack start` after setting `SLACK_BOT_TOKEN` + `SLACK_SIGNING_SECRET`.

---

## Discord bot

Invite link: `https://ctok-cli.github.io/ctok/discord/invite`.

Commands:

```
/ctok-check prompt:<prompt>
/ctok-refine prompt:<prompt>
```

Self-host: `apps/discord/`, Dockerfile included.

---

## Raycast extension

```
Raycast → Store → search "ctok" → Install
```

Commands:

- **ctok: Check Prompt** (`⌃⌘K`)
- **ctok: Refine Prompt** (`⌃⌘R`)
- **ctok: Scan Project** (`⌃⌘S`)

---

## Neovim plugin (preview)

Lazy.nvim:

```lua
{
  "ctok-cli/ctok.nvim",
  cmd = { "CtokCheck", "CtokRefine", "CtokScan" },
  opts = {},
}
```

Packer:

```lua
use { "ctok-cli/ctok.nvim" }
```

Commands: `:CtokCheck`, `:CtokRefine`, `:CtokScan`. Visual selection → `:CtokRefine` shows a floating diff window.

> Status: **Preview**. Requires `ctok` CLI on `PATH`.

---

## Zed extension (preview)

In Zed, open **Extensions** (`cmd-shift-x`) and install **ctok**.

Right-click in editor → ctok → Check / Refine / Scan.

> Status: **Preview**. Wraps the `ctok` CLI.

---

## Xcode source extension (preview)

macOS only. Install the **ctok for Xcode** companion from the Mac App Store (or sideload `.app` from Releases), then enable in **System Settings → Login Items & Extensions → Xcode Source Editor**.

In Xcode: **Editor → ctok → Refine selection** / **Check selection**.

> Status: **Preview**. Requires `ctok` CLI installed via Homebrew.

---

## GitHub Action

Add token cost-impact comments to PRs:

```yaml
# .github/workflows/ctok.yml
name: ctok token impact
on:
  pull_request:
    paths:
      - "**.md"
      - "prompts/**"
      - "CLAUDE.md"

jobs:
  ctok:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: ctok-cli/ctok-action@v1
        with:
          fail-on-budget-exceed: 50000   # optional: fail if any prompt > 50k tokens
          comment: true                  # default true
```

The action posts a sticky PR comment summarising token deltas and refiner suggestions, and (optionally) fails CI if a prompt blows past a budget.

---

## Configuration

### Config file

`~/.ctok/config.json`:

```json
{
  "plan": "max20x",
  "telemetry": false,
  "defaultModel": "claude-sonnet-4-6",
  "topHeavyCount": 10,
  "anthropic-key": null
}
```

### Env vars

| Var | Purpose |
|---|---|
| `CTOK_HOME` | Override `~/.ctok/` |
| `CTOK_PLAN` | Override plan detection |
| `CTOK_DEBUG=1` | Verbose internals |
| `ANTHROPIC_API_KEY` | For `--llm` mode |
| `NO_COLOR=1` | Disable colour output |
| `FORCE_COLOR=1` | Force colour even in CI |

### `.ctokignore`

Same syntax as `.gitignore`. Per-project overrides for the scanner.

```gitignore
# Don't count fixture data toward token totals
test/fixtures/large-corpus/

# Always include this file even though gitignore skips it
!important.generated.ts
```

### CLAUDE.md template

`ctok init` writes a starter `CLAUDE.md` that other Claude Code repos can extend.

---

## Privacy

ctok is **offline by default**.

- No telemetry unless you opt in with `ctok config set telemetry true`.
- When opted in: only event names + version + platform - never prompt text, file names, or repo content.
- `--llm` mode is the **only** path that sends prompt text off-machine, and only to Anthropic (your API key, your account).
- Browser extension makes zero remote calls.
- MCP server is local stdio only.

See [SECURITY.md](SECURITY.md) for the responsible-disclosure address.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ctok: command not found` | Check `npm root -g`/bin is on `PATH`, or re-run the installer |
| `EACCES` on global install | Use `npm install -g --prefix ~/.npm-global` or use the `curl` installer |
| Wrong plan detected | `ctok config set plan max20x` (or your plan) |
| Diff colours don't render | `chcp 65001` in Windows cmd, or use Windows Terminal / PowerShell 7 |
| `--llm` fails with `E_LLM_NOT_INSTALLED` | `npm i -g @ctok/refiner-llm` then re-run |
| Scanner counts `node_modules` | Run `ctok init` to create `.ctokignore`, or pass `--respect-gitignore` |
| MCP tool not appearing in Claude Code | Restart the host app; check `~/.claude.json` syntax with `ctok doctor` |
| Tauri desktop won't launch (Linux) | Install `libwebkit2gtk-4.1-0` and `libayatana-appindicator3-1` |

When stuck, run `ctok doctor` and paste the output into an issue.

---

## Uninstall

```sh
# CLI
npm uninstall -g @ctok/cli

# Homebrew
brew uninstall ctok-cli/tap/ctok

# Scoop
scoop uninstall ctok

# winget
winget uninstall ctok-cli.ctok

# Config + history (manual)
rm -rf ~/.ctok
```

Browser ext, IDE extensions, and bots uninstall from their respective stores.

---

*Found a bug or have an idea? Open an issue: [github.com/ctok-cli/ctok/issues](https://github.com/ctok-cli/ctok/issues)*
