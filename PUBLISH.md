# Publish checklist - ctok v0.1.0

> Hand-run checklist for shipping the first public release. Most steps need browser auth, so they're not automated.
> Run them in order. Stop at any failure; don't proceed until it's green.

---

## 0. Pre-flight (local)

```sh
# Confirm everything still builds and tests pass
pnpm install
pnpm --filter "@ctok/*" --filter "!@ctok/desktop" build
pnpm --filter "@ctok/*" --filter "!@ctok/desktop" test

# Smoke-test the CLI binary
node packages/cli/dist/cli.js --version
node packages/cli/dist/cli.js check "Refactor the auth module to use JWT"
node packages/cli/dist/cli.js refine --diff "please can you kindly help me handle the auth thing"

# Confirm critical files
ls LICENSE USAGE.md README.md CHANGELOG.md CONTRIBUTING.md SECURITY.md
```

Expected: all four commands exit 0. All files present.

---

## 1. Git init & commit

```sh
git init
git add -A
git commit -m "chore: initial ctok monorepo"
git branch -M main
```

If the repo already has history, skip `init` and just commit.

---

## 2. Create the GitHub org and repo

In browser:

1. Create org `ctok-cli` at https://github.com/organizations/new (Free plan).
2. Create repo `ctok-cli/ctok` (public, no README/license/gitignore - we already have them).
3. Add short description: *"Lighthouse for Claude prompts - estimate tokens, recommend models, refine prompts."*
4. Add website: `https://ctok.dev`.
5. Add topics: `claude`, `claude-ai`, `claude-code`, `claude-tokens`, `tokens`, `prompt-engineering`, `llm`, `anthropic`, `cli`, `mcp`, `vscode-extension`, `jetbrains-plugin`, `tauri`, `chrome-extension`.

Then:

```sh
git remote add origin https://github.com/ctok-cli/ctok.git
git push -u origin main
```

---

## 3. Repo settings

Settings → General:
- Enable **Issues**, **Discussions**.
- Disable **Wiki**, **Projects** (use Discussions instead).

Settings → Branches → Add rule for `main`:
- Require pull request before merging.
- Require status checks: `ci`.
- Block force pushes.

Settings → Code security → Dependabot:
- Enable security updates + version updates.

Settings → Secrets and variables → Actions → New repository secret:
- `NPM_TOKEN` - npmjs.com → Access Tokens → Granular → publish for `@ctok/*` scope.
- `VERCEL_TOKEN` - vercel.com → Settings → Tokens.
- Optional later: `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` for macOS notarisation.
- Optional later: `WINDOWS_CERTIFICATE`, `WINDOWS_CERTIFICATE_PASSWORD` for Windows signing.

Settings → Discussions → Categories:
- `Announcements` (post-only)
- `Show and tell` (community refines)
- `Ideas`
- `Q&A`

---

## 4. npm scope setup

```sh
npm login
npm org create ctok      # if it doesn't exist
```

Each public package needs `publishConfig.access: "public"`. Verify and add if missing in:
- `packages/core/package.json`
- `packages/scanner/package.json`
- `packages/refiner/package.json`
- `packages/refiner-llm/package.json`
- `packages/quota/package.json`
- `packages/cli/package.json`
- `packages/mcp/package.json`

(The `web`, `desktop`, `browser-ext` packages are `private: true` and don't get published.)

Dry-run from each public package to confirm:

```sh
pnpm --filter @ctok/core publish --dry-run --no-git-checks
```

---

## 5. First release

```sh
git tag v0.1.0
git push origin v0.1.0
```

This triggers `.github/workflows/release.yml`:
- Builds all CLI binaries (Windows x64, macOS arm64+x64, Linux x64+arm64).
- Attaches binaries to a GitHub Release.
- Publishes `@ctok/*` packages to npm.

Verify:

```sh
npm view @ctok/cli version       # should show 0.1.0
npm view @ctok/core version
npm view @ctok/mcp version
```

Then create the release notes in the GitHub UI (Releases → tag `v0.1.0` → "Create release from tag"). Paste from `CHANGELOG.md`. Link to `USAGE.md`. Embed `docs/launch/demo.svg`.

---

## 6. Sister repos

### Homebrew tap

```sh
gh repo create ctok-cli/homebrew-ctok --public --description "Homebrew tap for ctok"
cd /tmp && git clone https://github.com/ctok-cli/homebrew-ctok.git
mkdir -p homebrew-ctok/Formula
cp D:/ClaudeTokenCheker/scripts/homebrew/ctok.rb homebrew-ctok/Formula/
cd homebrew-ctok
git add . && git commit -m "feat: ctok formula v0.1.0" && git push
```

Test: `brew install ctok-cli/ctok/ctok` on a clean macOS box.

### Scoop bucket

```sh
gh repo create ctok-cli/scoop-ctok --public --description "Scoop bucket for ctok"
cd /tmp && git clone https://github.com/ctok-cli/scoop-ctok.git
mkdir -p scoop-ctok/bucket
cp D:/ClaudeTokenCheker/scripts/scoop/ctok.json scoop-ctok/bucket/
cd scoop-ctok
git add . && git commit -m "feat: ctok manifest v0.1.0" && git push
```

Test: `scoop bucket add ctok https://github.com/ctok-cli/scoop-ctok; scoop install ctok`.

### winget

Fork `https://github.com/microsoft/winget-pkgs`, copy `scripts/winget/*` into `manifests/c/ctok-cli/ctok/0.1.0/`, open a PR. Review turnaround ~3 days.

---

## 7. MCP registry

PR against `https://github.com/modelcontextprotocol/servers`:

Add to `README.md` under community servers:
```md
- **[ctok](https://github.com/ctok-cli/ctok/tree/main/packages/mcp)** - Estimate Claude token usage, recommend models, refine prompts. Tools: `estimate`, `refine`, `recommend_model`, `scan_project`.
```

Also submit to Anthropic's MCP directory if/when it's accepting submissions.

---

## 8. Marketplaces

### VS Code

```sh
cd apps/vscode
npm i -g @vscode/vsce
vsce login ctok-cli         # Azure DevOps PAT
vsce publish
```

### JetBrains

```sh
cd apps/jetbrains
./gradlew buildPlugin
# upload build/distributions/ctok-0.1.0.zip via https://plugins.jetbrains.com/plugin/add
```

### Chrome Web Store

```sh
cd packages/browser-ext
pnpm build
cd dist && zip -r ../ctok-chrome-0.1.0.zip .
# Upload via https://chrome.google.com/webstore/devconsole ($5 one-time dev fee)
```

Then submit the same zip to:
- Microsoft Edge Add-ons: https://partner.microsoft.com/dashboard/microsoftedge
- Firefox AMO: https://addons.mozilla.org/developers/

### Raycast

```sh
cd apps/raycast
npx ray publish
```

---

## 9. Vercel deploy (web playground)

```sh
npm i -g vercel
cd packages/web
vercel link        # ctok-cli/ctok-web
vercel --prod
```

Then in Vercel dashboard:
- Settings → Domains → add `ctok.dev`.
- Configure DNS at registrar: CNAME `cname.vercel-dns.com`.
- Settings → Environment Variables → leave empty (no server runtime).

Also redirect `www.ctok.dev` → `ctok.dev`.

---

## 10. Launch posts (T-0)

Follow `docs/launch/README.md`. Recommended posting order:

1. GitHub Release notes (link `USAGE.md`)
2. Product Hunt - schedule for 00:01 PST Tue/Wed
3. Hacker News - 08-10 PT weekday
4. r/ClaudeAI, r/programming
5. Twitter/X thread
6. LinkedIn
7. Bluesky
8. dev.to article
9. Anthropic Discord, MCP Discord

Always link to `USAGE.md` for "how to actually use this".

---

## 11. Post-launch (T+1 to T+7)

- Reply to all comments within 2-hour windows.
- Label 5 issues `good first issue`.
- Pitch newsletters: Latent Space, Ben's Bites, TLDR AI, AI Tidbits, Import AI.
- T+5: post a "what we learned" retro on LinkedIn.
- Watch for: npm download stats (use https://npmcharts.com/compare/@ctok/cli), GitHub stars, Vercel analytics on ctok.dev.

---

## 12. Known limitations to disclose in v0.1.0 release notes

- Tokenizer is heuristic + content-kind calibrated, not the real Claude tokenizer (not public). Ranges shown for honesty.
- Plan/quota numbers are conservative estimates; mark as "estimated" everywhere.
- Tauri desktop ships unsigned in v0.1.0 (Windows SmartScreen + macOS Gatekeeper will warn). Signing certs added in v0.2.0.
- JetBrains / Xcode / Nvim / Zed shells are **Preview**: they shell out to the bundled CLI. Full IDE integration in v0.2.0.
- `--llm` mode requires user's own ANTHROPIC_API_KEY. Hosted mode (Phase 2 freemium) gated on ≥1k stars or ≥10k weekly downloads.

---

*Anything broken or unclear? Update this file in the same PR that fixes it. The checklist is the contract.*
