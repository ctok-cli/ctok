# Claude Token Checker - Execution Plan

> **Goal of this document:** A self-contained, step-by-step blueprint that any developer (or Sonnet+medium running in fresh context) can follow to build the product from current state → production launch. Each numbered step in §13 is designed to fit in one Sonnet medium turn.

---

## 1. Context - Why we are rebuilding

The current `D:\ClaudeTokenCheker` is a Next.js webapp. The engine inside `src/lib/` is excellent - pure TypeScript, framework-agnostic, well-factored. **The shell is wrong.** Reasons:

- Real users (Android, iOS, Flutter, React Native, JS, business teams) can't and won't upload multi-GB project directories into a browser.
- `node_modules`, `Pods`, `.gradle`, `build/`, `target/` etc. should never be counted as input tokens - a browser can't filter them efficiently.
- Business teams won't `npm install` a webapp - they want a one-click installer.
- Power devs want it in their terminal, in their IDE, in their CI, and inside the AI itself (MCP).

**Solution: keep the engine, replace the shell with many shells.** One shared core, many thin wrappers. Free OSS to capture an emerging market quickly.

**Brand & command name:** `ctok` (short, memorable, available on npm). Tagline: *"Lighthouse for Claude prompts."*

---

## 2. Product Vision

Three jobs the user gets done every time:

1. **Estimate** - "How many tokens will this prompt + these files use?" (input + output ranges, USD, % of Claude plan quota, % of 200k context window).
2. **Recommend** - "Which model + effort should I pick for the best ROI?" (Haiku/Sonnet/Opus × low/med/high/xhigh).
3. **Refine** - "Rewrite my prompt to be tighter, clearer, and cheaper while keeping intent." (the killer differentiator - multi-pass heuristic refiner).

A fourth implicit job: **Educate** - every output explains *why*. Devs trust tools that show their work.

---

## 3. Audience & Surfaces

| Persona | Where they live | Primary surface |
|---|---|---|
| Android dev | Android Studio + bash/pwsh | CLI + JetBrains plugin (P2) |
| iOS dev | Xcode + zsh | CLI + Xcode source ext (P3) |
| Flutter / RN dev | VS Code + any shell | CLI + VS Code ext (P2) |
| Frontend / Backend JS | VS Code/Cursor + node | CLI + VS Code ext (P2) |
| Business / PM / Designer | Slack + browser | Web playground + Desktop app + Slack bot (P3) |
| AI-powered dev (Claude Code, Cursor, Zed) | their AI tool | **MCP server** |
| Casual user testing claude.ai | Chrome/Edge | Browser extension |

---

## 4. Architecture - Monorepo, shared engine, thin shells

```
ctok/  (new repo, or restructured current repo)
├── package.json                # workspaces root, pnpm
├── pnpm-workspace.yaml
├── turbo.json                  # turborepo for caching builds
├── tsconfig.base.json
├── packages/
│   ├── core/                   # @ctok/core - pure TS engine (lifted from src/lib/)
│   ├── scanner/                # @ctok/scanner - filesystem scanner with smart excludes
│   ├── refiner/                # @ctok/refiner - heuristic prompt refiner (the killer feature)
│   ├── quota/                  # @ctok/quota - Claude plan & quota tracker
│   ├── cli/                    # @ctok/cli - Commander.js CLI + interactive REPL
│   ├── web/                    # @ctok/web - Next.js web playground (ctok-cli.github.io/ctok)
│   ├── desktop/                # @ctok/desktop - Tauri wrapper around web UI
│   ├── mcp/                    # @ctok/mcp - Model Context Protocol server
│   └── browser-ext/            # @ctok/browser-ext - Chrome MV3 extension
├── apps/                       # ready for shells we don’t treat as libs
│   └── (vscode, jetbrains, raycast, … - Phase 2/3)
└── docs/                       # docusaurus or astro site
```

**Why monorepo:** every shell `import`s `@ctok/core` directly. Bug in the estimator? Fix once, every shell gets it. New model price? Update `core/pricing.ts`, ship a patch. This is the *only* way to keep many shells in sync.

**Package manager:** **pnpm + Turborepo**. Faster than npm workspaces, better caching, supports the cross-package symlinks every shell needs.

---

## 5. The shared core - what to lift and what to add

### 5.1 Lift as-is from `D:\ClaudeTokenCheker\src\lib\` into `packages/core/src/`

| Current file | New location | Action |
|---|---|---|
| `types.ts` | `core/src/types.ts` | Copy. Add `RefinedPrompt`, `QuotaUsage`, `ProjectScan` types. |
| `pricing.ts` | `core/src/pricing.ts` | Copy. |
| `estimator/*` | `core/src/estimator/*` | Copy unchanged. |
| `recommender/*` | `core/src/recommender/*` | Copy unchanged. |
| `reducer/*` | `core/src/reducer/*` | Copy unchanged. |

### 5.2 Refactor

- `utils.ts` → `core/src/utils.ts` - drop `clsx` and `tailwind-merge` imports. Keep `formatNumber`, `formatUsd`, `uid`, `clamp`, `truncate`.
- `store.ts` → **DELETE**. Zustand + localStorage is browser-only. Replace with a pure orchestrator:
  ```ts
  // core/src/analyze.ts
  export function analyze(input: EstimatorInput): AnalysisResult { … }
  ```
  Returns a single object with `{ tokens, cost, contextPct, recommendation, suggestions, refined }`. Pure function. Every shell calls this.

### 5.3 New core modules

- **`core/src/quota.ts`** - given a plan name (`pro` / `max5x` / `max20x` / `team` / `enterprise` / `api`) and current estimated tokens, return `{ percentOfDaily, percentOf5HourWindow, remaining, …}`. Plan limits as a typed table (will need verification from Anthropic docs).
- **`core/src/scanner.ts`** - in `@ctok/scanner` actually; called from CLI/desktop. See §6.
- **`core/src/refiner.ts`** - in `@ctok/refiner` actually; called from every shell. See §7.

---

## 6. Smart project scanner (`@ctok/scanner`) - never read node_modules again

A core differentiator. The user gestured at this specifically: "every JavaScript framework has node_modules… LLMs don't read it unless necessary." We must auto-exclude per language.

### 6.1 Project-type detection

Walk up from `cwd`, look for marker files:

| Marker | Project type | Auto-excludes |
|---|---|---|
| `package.json` | Node/JS/TS | `node_modules`, `.next`, `dist`, `build`, `.turbo`, `out`, `coverage`, `.cache`, `.vercel` |
| `pubspec.yaml` | Flutter / Dart | `build/`, `.dart_tool/`, `.flutter-plugins`, `.pub-cache` |
| `Podfile` or `*.xcodeproj` | iOS | `Pods/`, `DerivedData/`, `.build/`, `*.xcworkspace`, `xcuserdata/` |
| `build.gradle*` or `settings.gradle*` | Android / Gradle | `build/`, `.gradle/`, `app/build/`, `local.properties` |
| `Cargo.toml` | Rust | `target/` |
| `go.mod` | Go | `vendor/` (only if present) |
| `requirements.txt` / `pyproject.toml` | Python | `__pycache__/`, `venv/`, `.venv/`, `env/`, `*.egg-info/`, `.pytest_cache`, `.mypy_cache` |
| `Gemfile` | Ruby | `vendor/`, `.bundle/` |
| `composer.json` | PHP | `vendor/` |
| `pom.xml` / `build.gradle` | JVM | `target/`, `.gradle/`, `out/` |
| `Package.swift` | Swift package | `.build/`, `.swiftpm/` |
| `*.csproj` / `*.sln` | .NET | `bin/`, `obj/` |
| `mix.exs` | Elixir | `_build/`, `deps/` |

### 6.2 Universal excludes (every project)

`.git/`, `.svn/`, `.hg/`, `.DS_Store`, `Thumbs.db`, `*.lock`, `*.lock.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Cargo.lock`, `Podfile.lock`, `*.min.js`, `*.min.css`, `*.map`, `*.tsbuildinfo`, binaries (detected by extension allowlist: text-only files).

### 6.3 User-controllable rules

- **Respect `.gitignore`** - parse and apply.
- **Support `.ctokignore`** - same syntax as `.gitignore`, ctok-specific overrides.
- **Flag `--include node_modules`** etc. for when user genuinely wants it.

### 6.4 Output of scanner

```ts
type ProjectScan = {
  root: string;
  projectType: ProjectType;
  totalFiles: number;
  totalBytes: number;
  estimatedTokens: number;
  byExtension: Record<string, { files: number; tokens: number }>;
  topHeavyFiles: Array<{ path: string; tokens: number }>;
  excluded: { files: number; tokens: number; reasons: Record<string, number> };
};
```

CLI can render this as a tree, a table, or JSON.

---

## 7. The heuristic refiner (`@ctok/refiner`) - top-quality, multi-pass

**This is the killer feature.** It must give the *"best refinement and good approach to save tokens"* (user's exact words). Engineer it as a serious multi-pass pipeline, not a regex hack.

### 7.1 Pipeline (each pass returns deltas; final report is composable)

```ts
// refiner/src/index.ts
export function refine(input: RefineInput): RefineResult {
  const passes = [
    pass.fillerStrip,          // 7.2
    pass.vagueVerbReplace,     // 7.3
    pass.structureScaffold,    // 7.4
    pass.dedup,                // 7.5
    pass.fileRefCompression,   // 7.6
    pass.outputFormatHint,     // 7.7
    pass.negativeCollapse,     // 7.8
    pass.specificityScore,     // 7.9
  ];
  …
  return { original, refined, passes: appliedPasses, savedTokens, savedPct, specificityScore, warnings };
}
```

### 7.2 Filler-word strip

Curated regex list of low-signal phrases. Conservative - only strip when surrounding sentence still parses:

- `please`, `kindly`, `if you can`, `if possible`, `i was wondering`, `could you`, `would you mind`
- `make sure`, `be sure to`, `it's important that`, `it would be great if`
- `very`, `really`, `quite`, `just`, `actually`, `basically`, `essentially`
- `as you know`, `as i mentioned`, `for your information`, `feel free to`
- `i think`, `i believe`, `i feel like`, `in my opinion`

Each removal records token savings.

### 7.3 Vague-verb flag + replacement suggestions

Maintain a dictionary mapping vague verbs to better alternatives with context awareness:

| Vague | Replace with (suggested) |
|---|---|
| `handle X` | `validate / persist / transform / dispatch X` (offer top 3 by context keywords) |
| `deal with X` | same as above |
| `work on X` | `implement / refactor / debug X` |
| `improve X` | `optimize / refactor / extend / clarify X` |
| `fix it` | name the symptom + expected behavior |
| `make it better` | name a measurable axis (performance? readability?) |
| `something like X` | concrete example |
| `etc.` / `and so on` | list explicitly OR drop |

The refiner *suggests* - never silently rewrites. User chooses to accept (interactive CLI/Web UI) or accepts all (`--auto`).

### 7.4 Structure scaffold (the highest-impact pass)

If the prompt has no clear structure, suggest restructuring into:

```
GOAL: <one sentence, imperative>
CONTEXT: <what the AI needs to know>
CONSTRAINTS: <bullets>
OUTPUT: <format expected>
```

Detection: prompts that are ≥3 sentences AND lack any heading/colon-prefixed sections.

Token savings: typically negative on tiny prompts, positive on long rambling ones because it forces the user to delete redundant context.

### 7.5 Dedup

Fingerprint each "paragraph" or pasted block. If two blocks have ≥80% shingle overlap, flag the duplicate. Common cases:
- Same stack trace pasted twice.
- Same file content pasted in "context" and "the code".
- Repeated descriptions of the same problem.

### 7.6 File-reference compression

If the prompt contains a code block ≥300 tokens AND the user is in a project (scanner ran), suggest replacing the pasted code with a reference: `see src/foo.ts:42-90`. Claude Code can read it directly; saves the pasted tokens entirely.

### 7.7 Output-format hint

Detect missing output spec. If the prompt asks for code/data/list but doesn't say *how to return it*, suggest adding `Return only the diff` / `Return as JSON: {…}` / `Return a numbered list`. Output constraints cut output tokens dramatically.

### 7.8 Negative-instruction collapse

`don't do X, don't do Y, don't do Z` → bulleted `Do NOT:\n- X\n- Y\n- Z`. Same tokens, but clearer to the model, often improves output quality enough to avoid a retry.

### 7.9 Specificity score (0-100)

A composite score reflecting how well-formed the final prompt is:
- +20 has explicit goal verb
- +15 names concrete entities (files, functions, fields)
- +15 has measurable success criterion
- +15 has output format spec
- +10 lists constraints
- +10 names what NOT to do (when relevant)
- +15 references existing code paths instead of pasting

Show score before/after refinement. This becomes a shareable metric and a social hook ("My prompt scored 38 → 82 - saved 4,200 tokens with ctok 🚀").

### 7.10 Quality assurance for the refiner

Build a **refiner test corpus** under `packages/refiner/test/corpus/` with ~50 real prompts and their expected refinements. Run on every PR. This is what guarantees quality over time.

Sources to seed the corpus:
- Anthropic Cookbook examples
- Public Claude prompt-engineering guides
- Synthetic "bad prompts" (vague, rambling, redundant)
- Real prompts the user wants to refine (collected from session history)

---

## 8. CLI design (`@ctok/cli`)

### 8.1 Command surface

```
ctok                          # Interactive REPL - prompt for input, scan cwd, full report
ctok check "<prompt>"         # One-shot estimate; reads stdin if "<prompt>" is "-"
ctok check -f prompt.md       # Read prompt from file
ctok scan                     # Scan cwd, show token map + heavy files (no prompt needed)
ctok scan --json              # Same, JSON output (for piping)
ctok refine "<prompt>"        # Run refiner only; print refined version + savings
ctok refine -i                # Interactive: each suggestion → accept/reject
ctok model "<prompt>"         # Print recommended model + effort + why
ctok serve [--port 31337]     # Launch local web UI (the existing Next.js app)
ctok history                  # Show last N estimations
ctok history --csv            # Export to CSV
ctok diff <id1> <id2>         # Compare two history entries
ctok config                   # Open config in $EDITOR
ctok config set plan max20x   # Set plan
ctok config get plan          # Read plan
ctok init                     # Generate .ctokignore + CLAUDE.md template
ctok doctor                   # Diagnose install - node version, plan config, claude home detection
ctok --version
ctok --help
```

### 8.2 Output modes

- Default: pretty TTY output (tables, colors, sparklines via `chalk` + `cli-table3` + `ora`).
- `--json` flag on every command → machine-readable for piping.
- `--quiet` → only critical warnings.
- `--no-color` → CI-friendly.

### 8.3 CLI dependencies

- **Commander.js** - command/flag parser. Familiar, stable.
- **Prompts** (by terkelg) - interactive prompts.
- **Chalk** - colors.
- **cli-table3** - tables.
- **Ora** - spinners.
- **fast-glob** - file walking (scanner).
- **ignore** (npm package) - `.gitignore` parser.

### 8.4 Binary distribution

| Channel | Audience | Implementation |
|---|---|---|
| `npm i -g @ctok/cli` | Node users | publish to npm |
| Standalone .exe / .dmg / AppImage / .deb / .rpm | non-Node users | `pkg` or `bun build --compile`; attach to GitHub Releases |
| `brew install ctok` | macOS power users | Homebrew formula in `homebrew-ctok` tap |
| `scoop install ctok` | Windows power users | Scoop bucket |
| `winget install ctok` | Windows modern | winget manifest |
| `curl ctok-cli.github.io/ctok/install.sh \| sh` | Linux/macOS one-liner | shell installer that detects OS/arch and pulls right binary |
| `iwr ctok-cli.github.io/ctok/install.ps1 \| iex` | Windows PowerShell one-liner | PS installer |

---

## 9. Web playground (`@ctok/web`) - repurpose existing Next.js

**Reuse 95% of the current Next.js code.** Changes:

- Delete the project-upload UI (don't ask users to upload folders).
- Add prompt + optional file-content textarea. Hosted version is for *prompt analysis*, not project analysis.
- Replace direct calls to `lib/*` with imports from `@ctok/core` and `@ctok/refiner`.
- Add a public showcase page with examples (the 5 scenarios already in README.md).
- Deploy to **Vercel** at **ctok-cli.github.io/ctok** (or whatever domain is available; verify before purchase).
- Include a `<CLIPrompt>` banner: "For full project analysis install the CLI: `npm i -g @ctok/cli`".

Tech stays: Next.js App Router + Tailwind + the existing components. Drop Zustand + localStorage entirely (replace with React state + URL hash for shareable analyses).

---

## 10. Desktop app (`@ctok/desktop`) - Tauri

- **Tauri 2.x** (Rust-based shell, ~10 MB installer, secure, cross-platform). Bundles the React UI from `packages/web` (extracted into a static export) inside a native window.
- Adds local FS access (drag-drop project folder → uses `@ctok/scanner` natively).
- Distributes signed installers via GitHub Releases (`.exe` with code signing cert, `.dmg` notarized, `.AppImage` + `.deb` + `.rpm`).
- Auto-updater via Tauri's built-in updater.

Why Tauri over Electron: 10MB vs 150MB+, faster startup, lower memory, fewer "Electron is bloat" complaints.

---

## 11. MCP server (`@ctok/mcp`) - high-leverage distribution

Implements [Model Context Protocol](https://modelcontextprotocol.io) server. Exposes tools:

- `estimate(prompt, files?)` → `AnalysisResult`
- `refine(prompt)` → `RefineResult`
- `recommend_model(prompt)` → `{ model, effort, reasoning }`
- `scan_project(path)` → `ProjectScan`

Distribute via npm: `npx -y @ctok/mcp`. Users add one entry to their Claude Code / Cursor / Zed config:

```json
{
  "mcpServers": {
    "ctok": { "command": "npx", "args": ["-y", "@ctok/mcp"] }
  }
}
```

Submit to MCP registry and Anthropic's MCP directory. Strong distribution lever - every Claude Code user is a target.

---

## 12. Browser extension (`@ctok/browser-ext`)

- Manifest V3, vanilla TS + Preact (~10kb runtime).
- Content scripts on `claude.ai/*`, `chat.openai.com/*`, `cursor.sh/*`.
- Reads the textarea, runs `@ctok/core` analysis in-extension (no API calls - fully offline).
- Floating widget shows live token count, estimated cost, refiner suggestions on click.
- Publish to Chrome Web Store, Edge Add-ons, Firefox AMO.

---

## 13. Step-by-step build sequence (each step ≈ one Sonnet medium turn)

Each step is small enough to finish in one focused conversation with Sonnet 4.6 at medium effort. Steps are ordered so each depends only on prior steps.

### Phase 1 - Foundation (Steps 1-6)

**Step 1 - Restructure repo into pnpm workspaces monorepo.**
- Add `pnpm-workspace.yaml`, `turbo.json`, root `package.json` with workspaces.
- Create `packages/core/`, `packages/cli/`, `packages/web/`, `packages/refiner/`, `packages/scanner/`, `packages/quota/`, `packages/mcp/`, `packages/desktop/`, `packages/browser-ext/` directories with placeholder `package.json` each.
- Move existing Next.js code into `packages/web/`.
- Verify `pnpm install` + `pnpm -F @ctok/web dev` still serves the old UI on `localhost:3000`.

**Step 2 - Extract `@ctok/core`.**
- Copy `src/lib/types.ts`, `pricing.ts`, `estimator/*`, `recommender/*`, `reducer/*` into `packages/core/src/`.
- Strip clsx/twMerge from `utils.ts`.
- Delete `store.ts` - write new `packages/core/src/analyze.ts` with pure `analyze(input)` orchestrator.
- Configure tsup or unbuild to emit ESM + CJS + d.ts.
- Write Vitest unit tests for `analyze()` covering the 5 scenarios from README.md.
- Make `@ctok/web` import from `@ctok/core` instead of its own `lib/`. Web UI must still work identically.

**Step 3 - Build `@ctok/scanner`.**
- Implement project-type detection from §6.1.
- Implement universal + per-type excludes from §6.1-6.2.
- Wire `.gitignore` parsing via `ignore` package.
- Read `.ctokignore` if present.
- Use `fast-glob` for fs walk.
- Return `ProjectScan` shape from §6.4.
- Tests: fixture projects under `packages/scanner/test/fixtures/` (a fake Node project, Flutter project, iOS project, Android project, Rust project). Assert counts/excludes.

**Step 4 - Build `@ctok/refiner` - pipeline + first 4 passes (filler, vague-verb, structure, dedup).**
- Pipeline scaffold in `packages/refiner/src/index.ts`.
- Each pass is its own file under `packages/refiner/src/passes/`.
- Seed test corpus with ~15 prompts in `packages/refiner/test/corpus/`.
- Snapshot tests on the refined output (CI fails if output drifts unexpectedly).

**Step 5 - `@ctok/refiner` - remaining 4 passes (file-ref compression, output-format hint, negative collapse, specificity score).**
- Implement the four passes.
- Expand corpus to ~35 prompts.
- Tune until specificity score correlates with token savings (sanity-check on corpus).

**Step 6 - Build `@ctok/quota`.**
- Maintain a typed table of Claude plan limits (Pro / Max5x / Max20x / Team / Enterprise / API). Verify exact numbers from Anthropic docs before publish.
- Attempt to detect user's plan from `~/.claude/` config files (if present); else fall back to user config.
- Function: `getQuotaImpact(estimatedTokens, model, effort, plan)` → `{ percentOfDailyBudget, percentOf5HourWindow, …}`.
- Conservative: print "estimated" disclaimers everywhere because exact remaining quota isn't reliably exposed today.

### Phase 2 - Shells (Steps 7-10)

**Step 7 - Build `@ctok/cli` MVP.**
- Wire Commander.js commands from §8.1.
- Implement: `check`, `scan`, `refine`, `model`, `history`, `config`, `init`, `doctor`, `--version`, `--help`.
- Implement REPL when invoked without args.
- All commands call `@ctok/core`, `@ctok/scanner`, `@ctok/refiner`, `@ctok/quota`.
- Pretty TTY output via chalk + cli-table3 + ora.
- `--json` flag for piping.
- Test on Windows PowerShell, cmd, WSL, macOS zsh, Linux bash.

**Step 8 - CLI binary packaging.**
- Configure `pkg` (or `bun build --compile`) to emit `ctok.exe`, `ctok-macos-arm64`, `ctok-macos-x64`, `ctok-linux-x64`, `ctok-linux-arm64`.
- Set up GitHub Actions workflow `release.yml` that on `v*` tag: builds all binaries, signs the Windows one (code sign cert needed; for MVP can ship unsigned with warning), notarizes the macOS ones, attaches to GitHub Release.
- Write `install.sh` and `install.ps1` that detect OS/arch and download the right binary into `~/.ctok/bin/`.
- Create Homebrew tap `ctok-cli/homebrew-ctok` and Scoop manifest. Submit winget manifest.

**Step 9 - Repurpose `@ctok/web` as the public playground.**
- Strip project-upload UI (keep file-paste only).
- Add landing page hero + 5 example scenarios.
- Add "Install the CLI" banner.
- Switch state from Zustand+localStorage to React state + URL hash (for shareable links).
- Deploy to Vercel under `ctok-cli.github.io/ctok`. Use **AI Gateway** if/when we add LLM refiner in Phase 2 (per session knowledge update; default `"provider/model"` strings).

**Step 10 - Build `@ctok/mcp`.**
- Implement MCP server with the 4 tools listed in §11.
- Test against Claude Code locally: add it to `~/.claude.json`, verify tools appear.
- Publish to npm as `@ctok/mcp` so users can `npx -y @ctok/mcp` from their MCP config.
- Submit to MCP registry.

### Phase 3 - Distribution (Steps 11-13)

**Step 11 - Build `@ctok/desktop` (Tauri).**
- Scaffold Tauri 2 project pointing at the static export of `@ctok/web`.
- Add native drag-drop folder → invoke scanner via a Tauri command (Rust) that shells out to bundled Node, OR (cleaner) port `@ctok/scanner` invocations through Tauri's Rust fs APIs directly.
- Configure Tauri's auto-updater.
- Set up GitHub Actions to build & sign installers for Windows, macOS, Linux.

**Step 12 - Build `@ctok/browser-ext`.**
- Manifest V3 + Preact.
- Content scripts on `claude.ai/*`, `chat.openai.com/*`, `cursor.sh/*`, `chat.deepseek.com/*`, `gemini.google.com/*`.
- Floating overlay widget showing live token count + cost + "Refine" button.
- Submit to Chrome Web Store, Edge Add-ons, Firefox AMO.

**Step 13 - Launch prep.**
- [x] Polish docs site (Astro Starlight or Docusaurus) under `docs/`.
- Record 60-second demo video.
- Write launch posts: HN, Product Hunt, r/programming, r/ClaudeAI, dev.to, Twitter/X.
- [x] Set up GitHub issue templates, contributing guide, code of conduct.
- [x] Install scripts (`install.sh`, `install.ps1`) - OS/arch-detecting one-liners.
- [x] Add anonymous opt-in telemetry skeleton (PostHog or Plausible) - disabled by default.

### Phase 4 - Phase-2 shells (post-launch, prioritized by community demand)

- [x] VS Code extension (~3 days using `@ctok/core` directly).
- [x] JetBrains plugin (covers Android Studio, IntelliJ, AppCode, WebStorm - ~5 days, Kotlin + bundled Node).
- [x] GitHub Action (~1 day; wraps the CLI in a `node20` action).
- [x] Raycast extension (~1 day).
- [x] Slack bot (~3 days).
- [x] Discord bot (~3 days).
- [x] Optional LLM-powered refiner mode (`ctok refine --llm`) - adds Anthropic API call via Vercel AI Gateway, user supplies key.
- [x] Xcode source editor extension (~5 days; Swift wrapper that pipes to bundled CLI).
- [x] Neovim plugin + Zed extension (~2 days each).

---

## 14. Testing strategy

- **Vitest** unit tests in every package. Target ≥85% coverage on `core`, `refiner`, `scanner`, `quota`.
- **Refiner corpus tests** - snapshot the refined output for ~50 real prompts. PR-blocking.
- **CLI integration tests** - spawn the built CLI binary in a test fixture project, assert exit code + stdout snapshot.
- **Cross-platform CI** - GitHub Actions matrix: Windows / macOS-13 / macOS-14 / Ubuntu / on Node 20 + 22 + 24.
- **Manual QA checklist** for shells without robust automation (desktop, browser ext).

---

## 15. Quality / DX bar

- Every command shows progress (ora spinner) for anything >200ms.
- Errors are *helpful*, never stack-trace dumps. Use a custom error class with `code`, `message`, `hint`.
- `--debug` prints internals; otherwise silent on success.
- Zero color noise - colors only for status (green ok, yellow warn, red danger).
- `ctok doctor` is a first-class debugging entry point.

---

## 16. Privacy & security

- **No telemetry in MVP.** Add opt-in later.
- **No network calls in MVP** other than `ctok serve` (localhost) and binary auto-update checks.
- Refiner is fully offline.
- Quota detection reads `~/.claude/` config only if present, never uploads it.
- Browser extension: zero remote calls.
- Sign installers properly before launch (Windows: real code-sign cert; macOS: notarize via Apple Developer ID).

---

## 17. Monetization roadmap (deferred; OSS-first)

Phase 1 launch: 100% free, MIT.
Phase 2 freemium tier (after ≥1k stars or ≥10k weekly downloads - whichever first):
- **Free forever:** CLI, web, desktop, MCP, browser ext, IDE extensions, heuristic refiner.
- **Pro ($5-8 / mo):** LLM-powered refiner with ctok-hosted API (no key needed), cloud history sync, team budgets, Slack alerts on budget burn.
- **Team ($15 / user / mo):** org dashboards, SSO, audit logs, shared CLAUDE.md templates.
- Use **Vercel AI Gateway** for hosted LLM-refiner inference.

---

## 18. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Tokenizer accuracy drift as Anthropic models change | `core/estimator/tokenize.ts` is one function; swap in `count_tokens` API call when stable. |
| Refiner output feels generic / unhelpful | Refiner test corpus + specificity score guardrails + dogfood internally. |
| Plan/quota numbers wrong (Anthropic doesn't publish hard limits) | Print "estimated" everywhere; let users override. |
| Windows code-signing cost ($300/yr) | Ship unsigned with SmartScreen warning at first; buy cert when revenue justifies. |
| macOS notarization friction | Apple Developer Program ($99/yr) required Day 1 for desktop app. |
| MCP API changes pre-1.0 | Pin to current MCP SDK version; update on each spec release. |
| User confusion over many shells | Single docs site, single brand, single command name (`ctok`). |
| Audit: Vercel CLI is not installed locally | Install before deploying web: `npm i -g vercel` (per session knowledge update). |

---

## 19. End-to-end verification (post-build smoke test)

Run on a fresh Windows 11 box, a fresh macOS box, and a fresh Ubuntu box:

1. **CLI install.** `npm i -g @ctok/cli && ctok --version` shows version. `ctok doctor` reports green.
2. **Project scan.** `cd` into a real Flutter project, run `ctok scan`. Confirm `build/`, `.dart_tool/`, `.pub-cache` excluded; lib/ included.
3. **Prompt estimate.** `ctok check "refactor the auth middleware to use Postgres sessions"` shows tokens, cost, model recommendation, effort recommendation.
4. **Refine.** `ctok refine "please can you kindly help me to handle the auth thing somehow"` outputs a cleaned-up version + specificity score before/after + token savings.
5. **Web.** Open `ctok-cli.github.io/ctok`, paste same prompt, identical recommendation appears.
6. **Desktop.** Install signed installer, drag-drop the Flutter project, confirm identical scan results.
7. **MCP.** Add to Claude Code config, restart, ask Claude to "estimate tokens for this prompt" - confirms tool is callable.
8. **Browser ext.** Open `claude.ai`, start typing in the prompt box, confirm overlay shows live token count.

If all 8 pass on all 3 OSes → ship.

---

## 20. Tracking / ownership

- Use the existing GitHub repo (or rename to `ctok`).
- One issue per numbered Step (1-13). Label `phase-1`/`phase-2`/`phase-3`.
- Project board: To Do / In Progress / Review / Done.
- Each PR closes its Step issue.
- Cut a release after each step group: `v0.1.0` after Step 6 (engine), `v0.2.0` after Step 10 (CLI + MCP + web), `v1.0.0` after Step 13 (launch).

---

## 21. What to do RIGHT NOW (first concrete action when execution starts)

When you start executing with Sonnet+medium, the very first turn should accomplish **Step 1 only**:

> Restructure the current `D:\ClaudeTokenCheker` directory into a pnpm workspaces monorepo. Add `pnpm-workspace.yaml`, `turbo.json`, a root `package.json` with workspaces config. Move the existing Next.js code into `packages/web/`. Create empty placeholder `package.json` files in `packages/core/`, `packages/cli/`, `packages/refiner/`, `packages/scanner/`, `packages/quota/`, `packages/mcp/`, `packages/desktop/`, `packages/browser-ext/`. Verify that `pnpm install` succeeds and `pnpm -F @ctok/web dev` serves the existing UI on `localhost:3000` unchanged.

Each subsequent turn should pick up the next numbered Step from §13. Mark each Step done by closing the corresponding GitHub issue and updating this file's checkboxes:

- [x] Step 1 - Monorepo restructure
- [x] Step 2 - Extract `@ctok/core`
- [x] Step 3 - Build `@ctok/scanner`
- [x] Step 4 - Refiner pipeline + 4 passes
- [x] Step 5 - Refiner remaining 4 passes
- [x] Step 6 - Build `@ctok/quota`
- [x] Step 7 - CLI MVP
- [x] Step 8 - CLI binary packaging
- [x] Step 9 - Web playground
- [x] Step 10 - MCP server
- [x] Step 11 - Desktop (Tauri)
- [x] Step 12 - Browser extension
- [x] Step 13 - Launch prep

---

*This plan is the single source of truth. Update it as Steps complete or scope changes.*
