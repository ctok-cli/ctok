---
title: JetBrains Plugin
description: Install the ctok JetBrains plugin - works in IntelliJ IDEA, Android Studio, WebStorm, PyCharm, and all JetBrains IDEs.
---

The ctok JetBrains plugin adds a **ctok** tool window and two editor actions to any JetBrains IDE: IntelliJ IDEA, Android Studio, WebStorm, PyCharm, GoLand, and Rider.

## Install

1. Open **Settings / Preferences → Plugins → Marketplace**
2. Search **ctok**
3. Click **Install** and restart the IDE

Or install from disk: **Plugins → ⚙ → Install Plugin from Disk…** using the `.zip` from [GitHub Releases](https://github.com/ctok-cli/ctok/releases/latest).

## Requirements

- JetBrains IDE 2024.3+
- `ctok` CLI on PATH (`npm i -g ctok`)

## Actions

Find these under **Tools → ctok** or via **Find Action** (`Ctrl+Shift+A` / `Cmd+Shift+A`):

| Action | Description |
|--------|-------------|
| **Check Token Count** | Estimates tokens for the selection (or full file) and shows results in the tool window |
| **Refine Prompt** | Runs the 7-pass refiner on the selection; updates the tool window and replaces the selection with the refined text |

## Tool window

Open via **View → Tool Windows → ctok**.

The panel shows:
- Token estimate (input range, output range)
- Cost at the recommended model
- Model + effort recommendation
- Reduction suggestions
- Prompt area - edit and re-check inline

## Configuration

Set your plan in the ctok tool window settings (⚙ icon), or run:

```sh
ctok config set plan max20x
```
