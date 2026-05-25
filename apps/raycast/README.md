# ctok - Claude Token Estimator

Estimate Claude token usage, cost, and quota impact - refine prompts and scan projects without leaving your keyboard.

## Commands

### Check Token Usage
Paste a Claude prompt, pick a task type, and get an instant estimate: token counts, cost breakdown, model recommendation, and quota impact.

### Refine Prompt
Run the 7-pass heuristic refiner on any prompt. Strips filler words, collapses vague verbs, scaffolds structure, deduplicates content. Shows tokens saved and a specificity score.

### Check Clipboard as Prompt _(no-view)_
Reads the current clipboard and shows a one-line HUD: `🟡 2.3k tok · $0.0012 · haiku-4-5`. Fast enough to bind to a global shortcut.

### Scan Project Directory
Enter a directory path and get the full token footprint: project type, files scanned, tokens by extension, and the heaviest files.

### Token Check History
Browse recent estimates from the CLI and other surfaces - all shells write to the same `~/.ctok/history.json`.

## Preferences

| Preference | Default | Description |
|-----------|---------|-------------|
| Claude Plan | `pro` | Used for quota impact calculations. |
| Model Override | _(empty)_ | Force a specific model for cost estimates. |
| Default Task Type | `general` | Hint used when no task type is specified. |

## Installation

> Raycast extensions require the [Raycast](https://raycast.com) app (macOS only).

**From the Raycast Store** (once published):
Search for "ctok" in the Raycast Store.

**From source:**
```bash
git clone https://github.com/ctok-cli/ctok
cd ctok/apps/raycast
npm install   # or pnpm install
ray develop   # launches in Raycast development mode
```

## Privacy

All analysis runs locally. No prompt text is sent to any external service. The extension imports `@ctok/core`, `@ctok/refiner`, and `@ctok/quota` directly - zero network calls.
