---
title: Raycast Extension
description: Use ctok from Raycast - estimate tokens, refine prompts, and scan projects from anywhere on macOS.
---

The ctok Raycast extension gives you instant access to token estimation and prompt refinement from the Raycast launcher.

## Install

1. Open Raycast
2. Search **Store** → search **ctok**
3. Click **Install**

Or install from source:

```sh
cd apps/raycast
npm install
ray build
# Open Raycast → Extensions → Import Extension → select apps/raycast/
```

## Requirements

- macOS (Raycast is macOS-only)
- `ctok` CLI on PATH (`npm i -g ctok`)

## Commands

| Command | Description |
|---------|-------------|
| **Check Token Count** | Estimate tokens for a typed or pasted prompt |
| **Refine Prompt** | Run the 7-pass refiner and show the improved version |
| **Check Clipboard** | Instantly estimate tokens for whatever is on the clipboard |
| **Scan Project** | Scan a directory and show token footprint |
| **History** | Browse recent estimates |

## Preferences

Set in Raycast **Preferences → Extensions → ctok**:

| Preference | Description |
|------------|-------------|
| **Default model** | Model used for cost calculation |
| **Plan** | Claude plan for quota estimates |
| **ctok path** | Override the path to the `ctok` binary if not on PATH |
