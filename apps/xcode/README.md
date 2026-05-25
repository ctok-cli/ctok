# ctok Xcode Source Editor Extension

Estimate Claude token usage, cost, and quota impact without leaving Xcode. Run the 7-pass prompt refiner on any selected text inline.

## Commands

Available under **Editor → ctok** in Xcode's menu bar:

| Command | Description |
|---------|-------------|
| **Check Token Count** | Estimates tokens for the selection (or full file) and inserts a comment with the result |
| **Refine Selection** | Replaces selected text with the ctok-refined version; appends a comment showing tokens saved |
| **Scan Project Token Footprint** | Scans the configured project directory and inserts a summary comment |

## Requirements

- macOS 13+
- Xcode 15+
- `ctok` CLI on PATH: `npm i -g ctok`
- Apple Developer account (for signing + distribution)

## Build from source

### 1. Install XcodeGen

```bash
brew install xcodegen
```

### 2. Generate the Xcode project

```bash
cd apps/xcode
xcodegen generate
```

This produces `CtokXcode.xcodeproj`. You only need to re-run this when `project.yml` changes.

### 3. Open and sign

```bash
open CtokXcode.xcodeproj
```

In Xcode → **Signing & Capabilities**, select your team for both targets.

### 4. Run

Press **⌘R**. The host app launches. Then open any file in Xcode and look for **Editor → ctok**.

> **Tip:** You can keep the host app minimised — the extension stays loaded as long as the app is running.

## Configure scan directory

The **Scan** command defaults to your home directory. To point it at a project:

**Option A — via the host app UI:**  
Launch the ctok app, click **Choose…**, and select your project folder.

**Option B — via terminal:**
```bash
defaults write dev.ctok.shared scanDirectory /path/to/your/project
```

## Distribution

### Notarized direct download (recommended for open-source)

```bash
xcodebuild -project CtokXcode.xcodeproj \
  -scheme CtokXcodeApp \
  -configuration Release \
  -archivePath build/CtokXcode.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath build/CtokXcode.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build/export
```

Then notarise with `xcrun notarytool` and staple the result.

### Mac App Store

Remove the `com.apple.security.temporary-exception.*` entitlements and replace the `Process`-based CLI call with an XPC service bundled inside the extension. The XPC service can run without sandbox restrictions.

## Sandboxing note

The extension spawns the `ctok` CLI via `Process`. This requires the temporary entitlement exceptions listed in `CtokSourceExtension.entitlements`. **These entitlements are not permitted in Mac App Store submissions.** For MAS distribution, refactor to an XPC service or embed the ctok logic natively in Swift.

## Privacy

All analysis runs locally via the `ctok` CLI. No prompt text leaves your machine.
