---
title: Xcode Extension
description: Install the ctok Xcode source editor extension — token estimates and prompt refinement in Xcode.
---

The ctok Xcode source editor extension adds three commands to Xcode's **Editor** menu for estimating token usage and refining prompts without leaving the IDE.

## Requirements

- macOS 13+
- Xcode 15+
- `ctok` CLI on PATH (`npm i -g ctok`)
- Apple Developer account (for signing)

## Build from source

The extension is not yet on the Mac App Store. Build it yourself:

```sh
# Install XcodeGen
brew install xcodegen

# Generate and open the Xcode project
cd apps/xcode
xcodegen generate
open CtokXcode.xcodeproj
```

In Xcode, set your **Team** under Signing & Capabilities for both targets, then press **⌘R** to build and run.

## Enable the extension

1. Launch the **ctok** host app (it stays minimised in the background)
2. Open **System Settings → Privacy & Security → Extensions → Xcode Source Editor**
3. Enable **ctok Source Extension**

## Commands

Available under **Editor → ctok** in any open Xcode file:

| Command | Description |
|---------|-------------|
| **Check Token Count** | Estimates tokens for the selection (or full file) and inserts a comment with the result |
| **Refine Selection** | Replaces the selection with the ctok-refined version; appends a comment showing tokens saved |
| **Scan Project Token Footprint** | Scans the configured directory and inserts a summary comment |

## Set scan directory

**Option A — host app UI:** Launch the ctok app and click **Choose…**

**Option B — terminal:**
```sh
defaults write dev.ctok.shared scanDirectory /path/to/your/project
```
