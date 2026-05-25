# Hacker News - Show HN post

**Title:**
Show HN: ctok - Estimate Claude token usage, cost, and quota impact before sending

**Body:**

I built ctok (https://ctok.dev) because I kept blowing my Claude Pro 5-hour quota on prompts I could have trimmed.

It's a CLI + web playground that does three things before you send a prompt:

1. **Estimates tokens** - BPE-aware input/output ranges (not a character count ÷ 4 hack). Shows confidence level and per-chunk breakdown.

2. **Recommends a model + effort level** - Haiku vs Sonnet vs Opus with a written reason. Tells you if you're using a $15/M model for something a $0.25/M model can handle.

3. **Runs a 7-pass prompt refiner** - strips filler, deduplicates, compresses file references, adds structure. Shows specificity score 0-100 and tokens saved.

There's also a quota impact calculator - it tells you what % of your 5-hour window a given prompt burns, so you can decide if it's worth waiting.

**Surfaces:**
- `npm install -g @ctok/cli` - CLI with `check`, `refine`, `scan`, `model` commands
- https://ctok.dev - web playground with shareable URL-hash links
- `npx -y @ctok/mcp` - MCP server for Claude Code and other MCP clients (4 tools)
- Desktop app (Tauri 2) - drag-drop folder scan
- Chrome extension - live token counter on claude.ai, ChatGPT, Cursor, DeepSeek, Gemini

All token counting is local. No prompt text ever leaves your machine unless you opt in to anonymous telemetry (disabled by default - just event names and platform).

The estimator deliberately shows ranges rather than a single number because Claude's tokenizer isn't public. I calibrated ratios against observed behavior across code, prose, JSON, markdown, logs, diffs, and minified content. Happy to discuss the methodology.

Source: https://github.com/ctok-cli/ctok

---

**Anticipated questions to prep for:**

Q: How accurate are the estimates?
A: For clean prose: ±5-8%. For code: ±10-15% depending on language. Minified JS and base64 blobs are flagged separately because their BPE behavior is very different. The ranges deliberately show worst-case so you don't get surprised.

Q: Why not use the real tokenizer?
A: Anthropic hasn't published the Claude tokenizer. `tiktoken` (OpenAI's) gives different results. I'm using empirically-calibrated ratios with content-kind detection - better than a flat character count, honest about uncertainty.

Q: Does it work with Claude API too?
A: Yes - `ctok config set plan API` switches to per-token pricing math instead of the 5h window quota model.
