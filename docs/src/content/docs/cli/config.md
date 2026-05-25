---
title: Configuration
description: ctok configuration file reference and plan detection.
---

## Config file

ctok stores user settings at `~/.ctok/config.json` (override with `$CTOK_HOME`).

```json
{
  "plan": "pro",
  "telemetry": false
}
```

Edit with `ctok config edit` or set individual keys:

```sh
ctok config set plan max20x
ctok config set telemetry true
```

---

## Plan detection

ctok tries to determine your Claude subscription tier to show accurate quota estimates. Detection order:

1. **`CTOK_PLAN` environment variable** - highest priority
2. **`~/.claude/settings.json`** - Claude Code's own config file
3. **`~/.ctok/config.json`** - ctok's own config
4. **Default: `pro`**

Set your plan manually:

```sh
ctok config set plan max20x
```

Valid plans: `free`, `pro`, `max5x`, `max20x`, `team`, `enterprise`, `api`

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CTOK_HOME` | `~/.ctok` | Override ctok data directory |
| `CTOK_PLAN` | - | Force plan ID (overrides config detection) |
| `CTOK_TELEMETRY` | - | `1` to enable telemetry, `0` to disable (overrides config file) |
| `CLAUDE_HOME` | `~/.claude` | Override Claude home directory |
| `NO_COLOR` | - | Disable colour output |

---

## `.ctokignore`

Place a `.ctokignore` file at the root of a project to tell the scanner which files to skip. Uses gitignore syntax.

```
# Generated
dist/
build/
out/
.next/

# Dependencies
node_modules/
vendor/

# Secrets
.env*
*.key
```

Run `ctok init` to generate a sensible default.

---

## Telemetry

ctok collects **no telemetry by default**. You can opt in to anonymous usage stats (no PII, no prompt content):

```sh
ctok config set telemetry true
```

What is collected when opted in:
- Command name (e.g. `check`, `refine`)
- ctok version
- OS / platform
- Whether the run succeeded

What is **never** collected:
- Prompt text
- File names or contents
- API keys
- Any personally identifiable information
