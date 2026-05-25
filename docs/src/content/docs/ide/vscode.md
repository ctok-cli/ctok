---
title: VS Code Extension
description: Install and use the ctok VS Code extension — token estimates and prompt refinement inside the editor.
---

The ctok VS Code extension brings token estimation, model recommendations, and prompt refinement into the editor sidebar, status bar, and command palette.

## Install

Search **"ctok — Claude Token Estimator"** in the VS Code Marketplace, or:

```sh
code --install-extension ctok-cli.ctok
```

Alternatively, download the `.vsix` from the [GitHub Releases page](https://github.com/ctok-cli/ctok/releases/latest) and install via **Extensions → Install from VSIX…**

## Requirements

- VS Code 1.85+
- No external CLI needed — the extension uses `@ctok/core` directly

## Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and search **ctok**:

| Command | Description |
|---------|-------------|
| **ctok: Check Token Count** | Estimate tokens for selected text or the active file |
| **ctok: Refine Selection** | Run the 7-pass refiner on the selected text |
| **ctok: Scan Project** | Scan the workspace folder and show token footprint |
| **ctok: Open Panel** | Open the ctok tool window |
| **ctok: Set Plan** | Set your Claude subscription plan |

## Tool window

The ctok panel (View → Open View → ctok) shows:
- Input / output token estimates and ranges
- Cost breakdown at the recommended model
- Model + effort recommendation with reasoning
- Reduction suggestions

## Status bar

A `⚡ ~1.2k tok` badge appears in the status bar when you have text selected. Click it to open the full panel.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `ctok.plan` | `pro` | Your Claude subscription plan for quota estimates |
| `ctok.defaultModel` | _(auto)_ | Override the recommended model |

Configure via **Settings → Extensions → ctok**.
