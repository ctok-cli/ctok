---
title: MCP Server
description: Set up the ctok MCP server so Claude Code and other AI agents can call ctok as a tool.
---

The `@ctok/mcp` package implements the [Model Context Protocol](https://modelcontextprotocol.io) and exposes four tools that Claude Code (and any MCP-compatible agent) can call directly.

## Setup

Add to `~/.claude.json` (global) or `.claude/settings.json` (per-project):

```json
{
  "mcpServers": {
    "ctok": {
      "command": "npx",
      "args": ["-y", "@ctok/mcp"]
    }
  }
}
```

Restart Claude Code. Open a new conversation and you'll see the ctok tools available.

## Tools

### `estimate`

Estimate token usage, cost, and model recommendation for a prompt.

```
estimate(prompt, taskType?, pastedCode?, projectContext?)
```

Returns token ranges, USD cost, recommended model + effort, and reduction suggestions.

### `refine`

Run the 7-pass prompt refiner.

```
refine(prompt, context?)
```

Returns the refined prompt, token savings, specificity score 0–100, and per-pass details.

### `recommend_model`

Get the best model and effort level for a task.

```
recommend_model(prompt, taskType?)
```

Returns model ID, effort level, complexity breakdown, and reasoning.

### `scan_project`

Scan a local project directory.

```
scan_project(path?, topHeavyCount?)
```

Returns total token count, breakdown by extension, top-heavy files, and excluded file counts.

## Example usage in Claude Code

```
User: Before I send this refactor task, estimate the tokens.

Claude: [calls estimate with the task prompt]
        Input: ~1,240 tokens · Output: ~600 · Cost: $0.054 at Sonnet 4.6
        Recommendation: sonnet-4-6, medium effort
        No reduction suggestions — context looks lean.
```

## Run the server directly

```sh
npx -y @ctok/mcp
```

The server speaks JSON-RPC 2.0 over stdio and exits when stdin closes.
