# Reddit posts

---

## r/ClaudeAI

**Title:** I built a tool that estimates Claude token cost + quota impact before you send — CLI, web, MCP, and browser extension

**Body:**

Been burning my Pro 5-hour window faster than expected, so I built ctok to analyse prompts before sending.

**What it does:**

- Estimates input/output tokens with ranges (not fake-precise single numbers — Claude's tokenizer isn't public so I calibrated against observed behavior)
- Tells you % of your 5-hour window the prompt consumes
- Recommends Haiku vs Sonnet vs Opus with a written reason
- Runs a 7-pass prompt refiner that strips filler and saves tokens

**How to use it:**

```bash
npm install -g @ctok/cli
ctok check "your prompt here"
```

Or the web playground: https://ctok.dev (no install, shareable links)

There's also an MCP server (`npx -y @ctok/mcp`) if you want it integrated into Claude Code — it exposes `estimate`, `refine`, `recommend_model`, and `scan_project` tools.

And a Chrome extension that shows a live token count on the claude.ai composer.

No telemetry by default. Prompt text never leaves your machine. Open source: https://github.com/ctok-cli/ctok

Happy to answer questions about the estimation methodology or how the quota math works.

---

## r/programming

**Title:** ctok — CLI tool to estimate Claude prompt tokens, cost, and quota before sending (open source)

**Body:**

I've been using Claude heavily for coding tasks and kept running into two problems:

1. Not knowing if a prompt was worth sending before committing the tokens/cost
2. Poorly-formed prompts that burned quota on output I had to re-request anyway

So I built ctok — a token estimator and prompt analyser for Claude.

**Technical details:**

The estimator uses content-kind detection (code, prose, JSON, markdown, log, diff, minified) with empirically-calibrated BPE ratios for each. It returns ranges (min/expected/max) with a confidence level rather than a single number, because Claude's tokenizer isn't public and fake precision is worse than honest uncertainty.

The prompt refiner runs 7 passes in sequence:
1. `fillerStrip` — removes "please", "could you", "I need you to", etc.
2. `vagueVerbReplace` — "help me with" → "write" / "explain" / "fix"
3. `structureScaffold` — rewrites into `GOAL:` / `CONTEXT:` / `CONSTRAINTS:` / `OUTPUT:` sections if unstructured
4. `dedup` — removes repeated sentences/paragraphs
5. `fileRefCompression` — `Read file A, read file B, read file C` → `Read files: A, B, C`
6. `outputFormatHint` — appends format constraints if none present
7. `negativeCollapse` — deduplicates "don't do X" constraints

The quota calculator maps estimated tokens to the published Claude plan limits and tells you what % of your 5-hour window you're burning.

**Stack:** TypeScript, pnpm workspaces + Turborepo, tsup for builds, Vitest for tests. MCP via `@modelcontextprotocol/sdk`. Desktop via Tauri 2. Extension via Chrome MV3 + Preact in a Shadow DOM.

GitHub: https://github.com/ctok-cli/ctok
Install: `npm install -g @ctok/cli`

---

## r/ChatGPTCoding (crosspost note)

Use same r/programming post but change "Claude" to "Claude and other LLMs" in intro — the browser extension supports ChatGPT, Cursor, DeepSeek, and Gemini too.
