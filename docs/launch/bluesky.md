# Bluesky launch skeets

Bluesky character limit: 300. Threads via reply chain.

## Thread (3 skeets)

**Skeet 1:**

new tool day 🔦

ctok — Lighthouse for Claude prompts. estimate tokens, cost, quota impact, model recs, and a 7-pass refiner — all before you send.

`npm i -g @ctok/cli`

github.com/ctok-cli/ctok

#claude #ai #devtools

**Skeet 2:**

the killer view is `ctok refine --diff` — side-by-side coloured diff + a specificity score 0→100 + tokens saved.

most prompts shave 15–30% with zero loss of intent.

(it's heuristic, not an LLM — fully offline, no API calls, no telemetry.)

**Skeet 3:**

surfaces:

- CLI + REPL
- web (ctok.dev — shareable hash links)
- MCP for Claude Code / Cursor / Zed
- VS Code + JetBrains
- Slack + Discord bots
- GitHub Action that comments token impact on PRs
- Tauri desktop + Chrome extension

all MIT. all free. one shared engine.

## Standalone skeet

shipped ctok — free, open-source token estimator + 7-pass prompt refiner for Claude. CLI, MCP, VS Code, Slack, GitHub Action, Tauri desktop, Chrome ext. one engine.

`npm i -g @ctok/cli`

github.com/ctok-cli/ctok

#claude #ai #opensource

## Reply template (when someone posts about Claude costs)

> built ctok for exactly this — heuristic refiner that catches ~30% bloat + a GitHub Action that comments token impact on PRs. MIT: github.com/ctok-cli/ctok
