# Launch playbook

Posts in launch order on **Launch Day (T-0)**:

| # | Channel | File | Best window |
|---|---|---|---|
| 1 | GitHub Release notes | (in release UI) | 00:00 UTC |
| 2 | Product Hunt | [producthunt.md](producthunt.md) | 00:01 PST Tue/Wed |
| 3 | Hacker News | [hn.md](hn.md) | 08:00–10:00 PT weekday |
| 4 | r/ClaudeAI | [reddit.md](reddit.md) | 09:00 PT |
| 5 | r/programming | [reddit.md](reddit.md) | 10:00 PT |
| 6 | Twitter / X | [twitter.md](twitter.md) | 11:00 PT |
| 7 | LinkedIn | [linkedin.md](linkedin.md) | 12:00 PT |
| 8 | Bluesky | [bluesky.md](bluesky.md) | 12:30 PT |
| 9 | dev.to | [devto.md](devto.md) | 13:00 PT |
| 10 | Anthropic Discord `#projects-showcase` | (link only) | flexible |
| 11 | MCP Discord `#showcase` | (link only) | flexible |

**Demo asset:** [demo-script.md](demo-script.md) — what to record for the asciinema cast embedded in every post.

## Week-after follow-ups

- T+1: reply to all comments within 2h windows
- T+2: dev.to architecture deep-dive
- T+3: pitch newsletters (Latent Space, Ben's Bites, TLDR AI, AI Tidbits, Import AI)
- T+5: "what we learned" retro post on LinkedIn
- T+7: label 5 issues `good first issue`, post call-for-contributors

## Talking points (use across channels)

1. **Three jobs:** estimate, recommend, refine.
2. **One engine, many shells:** every surface imports the same `@ctok/core`.
3. **The viral hook:** `ctok refine --diff` — share the screenshot.
4. **MCP first:** plugs into Claude Code, Cursor, Zed with one config line.
5. **CI cost gate:** the GitHub Action fails builds when prompts exceed a budget.
6. **MIT, no telemetry by default.** Trust signal.

## Things NOT to do

- Don't say "AI-powered" — the refiner is heuristic, not LLM.
- Don't promise tokenizer accuracy — show ranges, not single numbers.
- Don't gatekeep features behind a paid tier in v1.
- Don't post in subreddits without engaging in comments.
