---
title: Web Playground
description: Use the ctok web playground at ctok.dev for instant token estimates in your browser.
---

The [ctok playground](https://ctok.dev) runs the full estimation engine in your browser. Nothing is sent to any server.

## Features

- **Prompt input** — paste your prompt, code snippet, or project context
- **Task type selector** — 8 types that tune the output-length model and model recommendation
- **Token meter** — input/output/total ranges with per-chunk breakdown table
- **Cost indicator** — USD cost + context window meter
- **Model recommendation** — pick or override the recommended model
- **Reduction suggestions** — flagged issues with estimated token savings
- **Session history** — save snapshots and compare against actual usage later

## Shareable links

The playground encodes the current prompt and task type in the URL hash. Copy the URL to share an analysis:

```
https://ctok.dev/#s=eyJwIjoiUmVmYWN0b3IgdGhlIGF1dGggbWlkZGxld2FyZSIsInQiOiJyZWZhY3RvciJ9
```

## Privacy

Everything runs client-side. No data leaves your browser. History is stored in `localStorage` and never transmitted.
