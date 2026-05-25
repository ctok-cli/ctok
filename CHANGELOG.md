# Changelog

All notable changes to ctok will be documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning: [SemVer](https://semver.org/).

---

## [Unreleased]

## [0.1.0] - 2026-05-25

### Added

**Core engine (`@ctok/core`)**
- BPE-aware token estimator with per-content-kind ratios (prose, code, JSON, markdown, log, diff, minified)
- Input/output range model with confidence levels (high / medium / low)
- Model recommender: complexity score → Haiku / Sonnet / Opus with written reasons
- Effort recommender: low / medium / high / xhigh, task-type overrides
- Reduction suggestions: 9 detectors (large files, logs, minified, diffs, duplicates, filler, many files, heavy context, context-window proximity)
- `analyze()` single entry-point used by all surfaces

**Project scanner (`@ctok/scanner`)**
- Recursive directory walk with `.gitignore` and `.ctokignore` support
- 14 project-type detectors
- Extension breakdown + top-heavy files report

**Prompt refiner (`@ctok/refiner`)**
- 7-pass pipeline: fillerStrip, vagueVerbReplace, structureScaffold, dedup, fileRefCompression, outputFormatHint, negativeCollapse
- Specificity score 0-100 across 7 dimensions
- 35-prompt test corpus with snapshot tests

**Quota calculator (`@ctok/quota`)**
- Plan limits table: Free, Pro, Max5x, Max20x, Team, Enterprise, API
- Plan auto-detection from `~/.claude/settings.json` → `~/.ctok/config.json` → env var
- `getQuotaImpact()` - percentage of 5-hour window + remaining messages

**CLI (`@ctok/cli`)**
- Commands: `check`, `scan`, `refine`, `model`, `history`, `diff`, `config`, `init`, `doctor`
- Interactive REPL (default with no arguments)
- Pretty TTY output via chalk + cli-table3 + ora
- `--json` flag for piping, `--quiet` for scripts
- History stored at `~/.ctok/history.json` (rolling 100 entries)
- Pre-compiled binaries for win-x64, macos-arm64, macos-x64, linux-x64, linux-arm64

**MCP server (`@ctok/mcp`)**
- 4 tools: `estimate`, `refine`, `recommend_model`, `scan_project`
- JSON-RPC 2.0 over stdio - works with `npx -y @ctok/mcp`

**Web playground (`@ctok/web`)**
- Next.js 15 app, static export
- URL-hash state for shareable links
- Hero section with 5 example scenarios and CLI install banner
- `ctok.dev` deployment via Vercel

**Desktop app (`@ctok/desktop`)**
- Tauri 2 wrapper around the web playground
- Drag-drop folder scan via Rust `scan_folder` command
- Auto-updater via `tauri-plugin-updater`
- Signed installers for Windows, macOS, Linux via GitHub Actions

**Browser extension (`@ctok/browser-ext`)**
- Chrome MV3, works on claude.ai, chatgpt.com, cursor.sh, deepseek.com, gemini.google.com
- Shadow-DOM isolated floating widget: token count, cost, model badge
- 7-pass refiner panel with copy-to-clipboard
- 82 KB self-contained IIFE - no external requests

[Unreleased]: https://github.com/ctok-cli/ctok/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ctok-cli/ctok/releases/tag/v0.1.0
