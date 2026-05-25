# ctok — Manual QA Checklist

Automated tests cover all TypeScript packages and most shells. This checklist covers the surfaces that can't be fully automated: the desktop app, browser extension, and end-to-end smoke tests across platforms.

Run this checklist before every release (`vX.Y.Z` tag).

---

## Platforms required

| Platform | Minimum version | Who |
|---|---|---|
| Windows 11 | 22H2 | Reviewer A |
| macOS (Apple Silicon) | 14 Sonoma | Reviewer B |
| Ubuntu | 22.04 LTS | Reviewer C (or CI) |

---

## 1. CLI installation smoke test

Run on all three platforms.

- [ ] `npm i -g @ctok/cli && ctok --version` — prints semver, exits 0
- [ ] `ctok doctor` — all checks green; no red lines
- [ ] `ctok check "Refactor auth middleware"` — prints token estimate table with Input / Output / Cost / Model
- [ ] `ctok check "Refactor auth middleware" --json` — valid JSON with `estimate`, `cost`, `recommendation` keys
- [ ] `ctok scan .` — lists file count and token map; no crash
- [ ] `ctok refine "please kindly help me to handle the thing"` — prints refined prompt with savings %
- [ ] `ctok refine --llm "please fix it" --api-key sk-test` — exits with helpful "API key required" or "model not found" (not a stack trace)
- [ ] `ctok history` — shows last entry from `check` above
- [ ] `ctok config set plan max20x` then `ctok config get plan` → `max20x`
- [ ] `ctok init` in a temp folder — creates `.ctokignore` and `CLAUDE.md`
- [ ] `ctok --help` — prints usage without error

---

## 2. CLI — binary distribution

- [ ] Download the correct binary for the current platform from the latest GitHub Release
- [ ] Run `./ctok --version` — prints correct version, exits 0
- [ ] Run `./ctok check "hello"` — produces output (no "node not found" or similar)
- [ ] Windows: SmartScreen warning appears on first run (expected for unsigned binary); user can click "More info → Run anyway"
- [ ] macOS: Gatekeeper quarantine warning appears; user can right-click → Open to bypass

---

## 3. Desktop app (Tauri)

Run on Windows and macOS.

### Install
- [ ] Download installer (`.exe` on Windows, `.dmg` on macOS)
- [ ] Installer completes without error
- [ ] App launches and shows the web UI

### Core features
- [ ] Paste a prompt in the textarea → token estimate appears within 1 second
- [ ] Model recommendation matches CLI output for the same prompt
- [ ] Cost breakdown shows Input / Output / Total USD
- [ ] Effort badge (🟢/🟡/🟠/🔴) renders correctly

### Project scan (desktop-only feature)
- [ ] Drag-drop a project folder onto the app → scan result appears
- [ ] `node_modules` / `build` / `.git` are NOT listed in heavy files
- [ ] File count and token total are non-zero for a real project

### Auto-updater
- [ ] With a release one version behind installed: launch the app → update prompt appears
- [ ] Accept update → app restarts at new version

### Regression checks
- [ ] No blank white screen on launch
- [ ] No "localhost refused to connect" error (Tauri dev server only, not in prod build)
- [ ] Memory usage stays below 200 MB after 5 minutes idle

---

## 4. Browser extension (Chrome MV3)

### Install
- [ ] Load unpacked extension in `chrome://extensions/` (or install from Web Store)
- [ ] Extension icon appears in toolbar
- [ ] Clicking icon opens popup without error

### claude.ai
- [ ] Open `claude.ai/new`
- [ ] Type a prompt in the message box
- [ ] ctok overlay appears showing live token count
- [ ] Count updates as text is typed
- [ ] "Refine" button opens the refine panel
- [ ] Refine panel shows the improved prompt and savings %

### Regression checks
- [ ] Extension does NOT intercept or modify network requests (check DevTools → Network)
- [ ] No console errors on `claude.ai` after extension is loaded
- [ ] Extension popup still works after the tab has been open for 30+ minutes

---

## 5. VS Code extension

### Install
- [ ] `code --install-extension ctok-*.vsix` (or install from Marketplace)
- [ ] Extension activates without errors in Output → ctok channel

### Commands
- [ ] Open a `.ts` file, run `Ctok: Check Tokens` — inline decoration appears
- [ ] Run `Ctok: Refine Prompt` on a selected block — suggestion appears in side panel
- [ ] Status bar shows token count for the active file

### Regression
- [ ] Extension does NOT slow down TypeScript IntelliSense (no noticeable lag after install)

---

## 6. JetBrains plugin

### Install
- [ ] Install `.zip` via Settings → Plugins → Install from disk
- [ ] Restart IDE; no error notification on startup

### Tool window
- [ ] `View → Tool Windows → ctok` opens the panel
- [ ] Enter a prompt, click Estimate — result appears with token count and cost
- [ ] "Refine" button sends prompt and shows refined version

### Actions
- [ ] Right-click in editor → `ctok: Check Selection` works with a text selection

---

## 7. Slack bot

- [ ] `/ctok check Refactor auth middleware` → bot replies with formatted token estimate
- [ ] `/ctok refine please help me handle the thing` → bot replies with refined prompt + savings
- [ ] `/ctok scan` → bot replies with project scan summary (requires ctok on the server)
- [ ] `/ctok help` → bot replies with usage instructions
- [ ] Mentioning `@ctok check hello` in a channel → bot replies in thread

---

## 8. Discord bot

- [ ] `/ctok check prompt:Refactor auth middleware` → bot embeds token estimate
- [ ] `/ctok refine prompt:please fix it` → bot embeds refined prompt
- [ ] `/ctok scan` → bot embeds scan summary
- [ ] All commands respond within 3 seconds (defer + editReply pattern)

---

## 9. MCP server

- [ ] Add to `~/.claude.json` mcpServers config: `{ "command": "npx", "args": ["-y", "@ctok/mcp"] }`
- [ ] Restart Claude Code
- [ ] In Claude Code, ask: "Use ctok to estimate tokens for: Refactor auth middleware" → Claude calls `estimate` tool and shows result
- [ ] Ask: "Use ctok to refine this prompt: please help me handle the auth thing" → Claude calls `refine` tool
- [ ] Ask: "Use ctok to scan my project" → Claude calls `scan_project` tool

---

## 10. Neovim plugin

- [ ] Install via lazy.nvim from `apps/nvim/` or `ctok-cli/ctok.nvim`
- [ ] `:CtokDoctor` → notification shows ctok version
- [ ] `:CtokCheck` on a buffer with prompt text → float window opens with token estimate
- [ ] Visual-select text, `:CtokRefine` → float shows refined version + savings
- [ ] Visual-select text, `:CtokRefineReplace` → selection replaced in-place
- [ ] `:CtokScan` → float shows project scan
- [ ] `q` closes the float window

---

## 11. Zed extension

- [ ] Install from Zed Extensions (search "ctok")
- [ ] Open AI assistant panel
- [ ] `/ctok-check Refactor auth middleware` → Markdown response with token estimate appears
- [ ] `/ctok-refine please fix the bug somehow` → Markdown response with refined prompt appears
- [ ] `/ctok-scan` (with a project open) → Markdown response with file breakdown appears
- [ ] All three commands appear in the slash-command autocomplete

---

## 12. Cross-platform regressions

Run after any change to `@ctok/core`, `@ctok/refiner`, `@ctok/scanner`, or `@ctok/quota`.

- [ ] Same prompt produces the same token estimate on all three OS platforms
- [ ] Same prompt produces the same refined output on all three OS platforms
- [ ] `ctok scan` on the monorepo root excludes `node_modules`, `dist`, `.turbo` on all three platforms
- [ ] History file (`~/.ctok/history.json`) is valid JSON after 10 consecutive `ctok check` runs

---

## Sign-off

| Item | Windows | macOS (ARM) | Ubuntu |
|---|---|---|---|
| 1. CLI smoke test | ☐ | ☐ | ☐ |
| 2. Binary distribution | ☐ | ☐ | N/A |
| 3. Desktop app | ☐ | ☐ | ☐ |
| 4. Browser extension | ☐ | ☐ | ☐ |
| 5. VS Code extension | ☐ | ☐ | ☐ |
| 6. JetBrains plugin | ☐ | ☐ | ☐ |
| 7. Slack bot | ☐ | N/A | N/A |
| 8. Discord bot | ☐ | N/A | N/A |
| 9. MCP server | ☐ | ☐ | ☐ |
| 10. Neovim plugin | ☐ | ☐ | ☐ |
| 11. Zed extension | N/A | ☐ | ☐ |
| 12. Cross-platform regressions | ☐ | ☐ | ☐ |

**Release approved by:** _______________  **Date:** _______________
