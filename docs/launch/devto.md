---
title: "I built ctok: estimate Claude token cost before you send"
published: true
description: "A CLI, web playground, MCP server, desktop app, and browser extension that estimates tokens, recommends models, refines prompts, and shows quota impact - all before you hit send."
tags: claude, ai, cli, opensource
cover_image: https://ctok.dev/og.png
---

# ctok: Lighthouse for Claude prompts

If you use Claude regularly, you've probably run into one of these:

- A prompt you spent 10 minutes crafting cost 3x what you expected
- You burned your 5-hour Pro quota before lunch because a big context dump wasn't worth sending
- A slightly better-phrased version of the same prompt would have saved 40% of the tokens

I built **ctok** to fix all of this. It estimates your Claude prompt - tokens, cost, quota impact, and model recommendation - before you send it.

## Install and try it in 30 seconds

```bash
npm install -g @ctok/cli
ctok check "Refactor the auth module to use JWT and add refresh token rotation"
```

Output:

```
  Token estimate
  ┌───────────────────┬──────────────────────────────────────────┐
  │ Input tokens      │ 18 (range 15-22)                         │
  │ Output tokens     │ 1,400 (range 800-2,100)                  │
  │ Context window    │ 0.7% of 200k                             │
  └───────────────────┴──────────────────────────────────────────┘

  Cost
  ┌───────────────────┬──────────────────────────────────────────┐
  │ Model             │ claude-sonnet-4-6                        │
  │ Input cost        │ $0.00003                                 │
  │ Output cost       │ $0.00420                                 │
  │ Total (expected)  │ $0.00423                                 │
  │ Total (range)     │ $0.00240 - $0.00633                      │
  └───────────────────┴──────────────────────────────────────────┘

  Recommendation
  ┌───────────────────┬──────────────────────────────────────────┐
  │ Model             │ sonnet                                   │
  │ Effort            │ high                                     │
  │ Why               │ Refactoring with security implications   │
  └───────────────────┴──────────────────────────────────────────┘
```

## The prompt refiner

The part I'm most proud of is the 7-pass prompt refiner:

```bash
ctok refine "please can you help me to write a function that does sorting of an array"
```

The refiner runs these passes in order:

| Pass | What it does |
|------|-------------|
| `fillerStrip` | Removes "please", "could you", "I need you to", etc. |
| `vagueVerbReplace` | "help me with" → "write" / "explain" / "fix" |
| `structureScaffold` | Rewrites into `GOAL:` / `CONTEXT:` / `CONSTRAINTS:` / `OUTPUT:` if unstructured |
| `dedup` | Removes repeated sentences |
| `fileRefCompression` | "Read A, read B, read C" → "Read files: A, B, C" |
| `outputFormatHint` | Appends output format if not specified |
| `negativeCollapse` | Deduplicates "don't do X" constraints |

Most prompts improve 15-30% in token efficiency. The refiner also gives you a specificity score 0-100 across 7 dimensions.

## Token estimation methodology

Claude's tokenizer isn't public. Using OpenAI's `tiktoken` gives wrong results. So I built a content-kind detector that identifies code, prose, JSON, markdown, logs, diffs, and minified content, then applies empirically-calibrated BPE ratios for each.

The key insight: don't report a single number. Report a range (min/expected/max) with a confidence level. Fake precision is worse than honest uncertainty.

## Quota impact

If you're on Claude Pro, Max, or Team, the quota calculator maps your estimated tokens to the published 5-hour window limits and tells you what % you're burning:

```
  Quota impact
  ┌───────────────────┬──────────────────────────────────────────┐
  │ Plan              │ pro                                      │
  │ 5h window         │ 2.3% used by this prompt                │
  │ Remaining         │ ~43 similar prompts                      │
  └───────────────────┴──────────────────────────────────────────┘
```

## All the surfaces

ctok ships on five surfaces:

**CLI** - the fastest way to check a prompt:
```bash
ctok check -f my-big-prompt.md
ctok refine "my prompt" --auto   # apply all refiner suggestions silently
ctok scan ./my-project           # token footprint of a whole directory
```

**Web playground** at [ctok.dev](https://ctok.dev) - paste a prompt, get a shareable `#hash` link you can send to teammates.

**MCP server** - add to Claude Code or any MCP client:
```json
{
  "mcpServers": {
    "ctok": { "command": "npx", "args": ["-y", "@ctok/mcp"] }
  }
}
```

Exposes `estimate`, `refine`, `recommend_model`, and `scan_project` tools.

**Desktop app** (Tauri 2) - drag a folder onto the window, get a full token breakdown with file-level stats.

**Chrome extension** - live token counter overlay on claude.ai, ChatGPT, Cursor, DeepSeek, and Gemini. 82 KB self-contained, no external requests.

## Privacy

No prompt text ever leaves your machine. Telemetry is opt-in and disabled by default. When enabled, it only sends anonymous event names, app version, and platform - nothing else.

## Open source

Everything is MIT-licensed at [github.com/ctok-cli/ctok](https://github.com/ctok-cli/ctok).

The repo is a pnpm workspaces + Turborepo monorepo with 10 packages. The core engine (`@ctok/core`) is pure functions with no I/O - easy to embed in other tools.

---

Happy to answer questions about the token estimation approach, the refiner pass design, or anything else in the comments.
