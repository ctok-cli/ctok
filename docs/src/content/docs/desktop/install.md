---
title: Desktop App
description: Install the ctok desktop app — a native Tauri wrapper for the ctok playground with drag-drop folder scanning.
---

The ctok desktop app is a native application built with [Tauri 2](https://tauri.app). It bundles the web playground in a native window and adds local filesystem access for drag-drop project scanning.

## Download

Get the latest installer from the [GitHub Releases page](https://github.com/ctok-cli/ctok/releases/latest).

| Platform | File | Size |
|----------|------|------|
| Windows | `ctok_x64_en-US.msi` | ~10 MB |
| macOS (Apple Silicon) | `ctok_aarch64.dmg` | ~10 MB |
| macOS (Intel) | `ctok_x64.dmg` | ~10 MB |
| Linux | `ctok_amd64.AppImage` | ~10 MB |
| Linux (Debian/Ubuntu) | `ctok_amd64.deb` | ~10 MB |

## Features beyond the web playground

### Drag-drop folder scan

Drop a project folder onto the app window to instantly scan it:

- Walks the directory tree (respects `.ctokignore` and `.gitignore`)
- Estimates token count per file and by extension
- Shows the 10 heaviest files
- Injects a scan summary into the prompt field

### Auto-updater

The app checks for updates on launch and prompts you to install them silently.

## macOS note

The app is notarized by Apple. On first launch, right-click → Open if Gatekeeper blocks it.

## Linux note

Make the AppImage executable before running:

```sh
chmod +x ctok_amd64.AppImage
./ctok_amd64.AppImage
```
