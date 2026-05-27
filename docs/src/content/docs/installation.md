---
title: Installation
description: Install ctok via npm, Homebrew, Scoop, winget, or a one-line script.
---

## CLI (recommended)

The fastest way to start: install the global CLI.

### npm / pnpm / bun

```sh
npm install -g ctok
pnpm add -g ctok
bun add -g ctok
```

### curl (macOS / Linux)

Installs a pre-compiled binary into `~/.ctok/bin/` and adds it to `PATH`.

```sh
curl -fsSL https://ctok-cli.github.io/ctok/install.sh | sh
```

### PowerShell (Windows)

```powershell
irm https://ctok-cli.github.io/ctok/install.ps1 | iex
```

### Homebrew (macOS / Linux)

```sh
brew tap ctok-cli/tap
brew install ctok
```

### Scoop (Windows)

```powershell
scoop bucket add ctok https://github.com/ctok-cli/scoop-ctok
scoop install ctok
```

### winget (Windows)

```powershell
winget install CtokCLI.ctok
```

---

## Verify

```sh
ctok --version    # 0.1.0
ctok doctor       # checks environment, config, plan detection
```

---

## Requirements

- Node.js ≥ 18 (for the npm package)  
- No Node required for the pre-compiled binary install

---

## Web playground

No install needed - open [ctok-cli.github.io/ctok](https://ctok-cli.github.io/ctok) in any browser.

---

## MCP server

Add to your Claude Code config (`~/.claude.json`):

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

Restart Claude Code. Four tools appear: `estimate`, `refine`, `recommend_model`, `scan_project`.

---

## Desktop app

Download the installer for your platform from the [GitHub Releases page](https://github.com/ctok-cli/ctok/releases/latest):

| Platform | File |
|----------|------|
| Windows | `ctok_x64_en-US.msi` |
| macOS (Apple Silicon) | `ctok_aarch64.dmg` |
| macOS (Intel) | `ctok_x64.dmg` |
| Linux | `ctok_amd64.AppImage` or `.deb` |

---

## Browser extension

Install from your browser's store:

- **Chrome / Edge**: [Chrome Web Store](https://chrome.google.com/webstore/detail/ctok)
- **Firefox**: [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/ctok/)
