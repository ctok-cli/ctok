# LinkedIn launch post

## Long-form post (1300 chars)

I shipped something today: **ctok** — a free, open-source tool that estimates Claude API token usage and refines prompts *before* you spend a single token.

Why I built it: engineering teams are burning thousands a month on Claude prompts they could have made 30% smaller with two minutes of refinement. There's no Lighthouse for prompts.

ctok runs everywhere your team already works:

→ **CLI:** `npm i -g @ctok/cli` then `ctok check "<prompt>"`
→ **VS Code / JetBrains:** highlight, refine, see the diff in a side panel
→ **MCP server:** plug it into Claude Code, Cursor, or Zed in one config line
→ **GitHub Action:** comments token impact + budget warnings on every PR
→ **Slack & Discord:** `/ctok check` and `/ctok refine` for non-engineers
→ **Desktop & browser ext:** drag-drop scans + live token counter on claude.ai, ChatGPT, Cursor

The core differentiator is the **prompt refiner**: a 7-pass heuristic pipeline (filler strip, vague-verb replace, structure scaffold, dedup, file-ref compression, output-format hint, negative collapse) plus a 0–100 *specificity score* that quantifies prompt quality.

100% MIT. No telemetry by default. No paid tier in v1.

If your org has an AI cost-governance problem, the GitHub Action alone is worth a look — it can fail CI on a token-budget overrun.

GitHub: https://github.com/ctok-cli/ctok
Try it: https://ctok.dev

#AI #DeveloperTools #Claude #Anthropic #OpenSource #DevEx #LLMOps

## Short-form post (600 chars)

Spent $200 last month on Claude because of one bloated prompt. So I shipped ctok — a free, open-source token estimator and prompt refiner.

- CLI: `npm i -g @ctok/cli`
- VS Code, JetBrains, MCP for Claude Code
- GitHub Action that comments token impact on every PR
- Slack + Discord bots for non-engineers

Try it: https://ctok.dev
Source: https://github.com/ctok-cli/ctok

Star the repo if you've ever opened the Anthropic billing dashboard and winced. ↗️

#Claude #AI #DevTools #OpenSource

## Targeted comment template (when someone asks about AI cost)

> Genuinely had this exact problem last quarter. Built ctok partly to solve it: it has a GitHub Action that fails CI when a prompt blows past a configurable token budget, plus a heuristic refiner that catches ~30% of slack on most prompts before they ever ship. MIT, free: github.com/ctok-cli/ctok

## Headline variants (for A/B)

- "I built the Lighthouse for Claude prompts. It's open source."
- "How we cut our Claude bill 38% with one heuristic pass."
- "Your team is overpaying for Claude. Here's the free tool that fixes it."
- "Three lines in your CI config → token-budget enforcement on every PR."
