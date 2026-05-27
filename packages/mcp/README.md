# @ctok/mcp

MCP server for [ctok](https://ctok-cli.github.io/ctok) - lets Claude Code and any MCP-compatible AI agent call ctok as a tool.

## Usage

Add to your Claude Code config (`~/.claude.json` or per-project `.claude/settings.json`):

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

Restart Claude Code. The following tools become available:

| Tool | Description |
|------|-------------|
| `estimate` | Token count, cost, model recommendation, and reduction suggestions |
| `refine` | 7-pass prompt refiner - strips filler, improves specificity, saves tokens |
| `recommend_model` | Best Claude model + effort level for a given task |
| `scan_project` | Scan a local directory and estimate its token footprint |

## Tool reference

### `estimate`
```
estimate(prompt, taskType?, pastedCode?, projectContext?)
```
Returns: `{ tokens, cost, recommendation, suggestions }`

### `refine`
```
refine(prompt, context?)
```
Returns: `{ original, refined, savedTokens, savedPct, specificityScore, passes, warnings }`

### `recommend_model`
```
recommend_model(prompt, taskType?)
```
Returns: `{ model, modelReason, alternatives, effort, effortReason, complexity }`

### `scan_project`
```
scan_project(path?, topHeavyCount?)
```
Returns: `{ root, projectType, totalFiles, estimatedTokens, byExtension, topHeavyFiles, excluded }`

## Run directly

```sh
npx -y @ctok/mcp
```

The server speaks JSON-RPC 2.0 over stdio and exits when stdin closes.

## License

MIT
