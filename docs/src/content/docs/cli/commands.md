---
title: CLI Commands
description: Complete reference for all ctok CLI commands.
---

## Global flags

All commands accept these flags:

| Flag | Description |
|------|-------------|
| `--json` | Output machine-readable JSON |
| `-q, --quiet` | Minimal output (result only) |
| `--no-color` | Disable colour |
| `--version` | Print version |
| `--help` | Show help |

---

## `ctok check`

Estimate token usage for a prompt.

```sh
ctok check [prompt]
ctok check -f path/to/prompt.txt
echo "my prompt" | ctok check -
```

**Options**

| Flag | Description |
|------|-------------|
| `-f, --file <path>` | Read prompt from file |
| `-m, --model <id>` | Override model for cost (`haiku-4-5`, `sonnet-4-6`, `opus-4-7`) |
| `--no-save` | Do not save to history |

**Example output**

```
  Input tokens    ~1,240  (range 1,190–1,295, medium confidence)
  Output tokens   ~600
  Estimated cost  $0.054  at Sonnet 4.6

  Recommendation  sonnet-4-6 · medium effort
  Why             Standard feature work. Sonnet 4.6 is the default workhorse.

  Reduction suggestions
  ⚠  Large file: schema.prisma  (~8,400 tok)
     Action: trim to the relevant tables only — save ~6,200 tokens
```

---

## `ctok scan`

Scan a project directory and show token distribution.

```sh
ctok scan                   # scans current directory
ctok scan path/to/project
ctok scan --top 20          # show 20 heaviest files
```

**Options**

| Flag | Default | Description |
|------|---------|-------------|
| `--top <n>` | 10 | Number of heaviest files |

---

## `ctok refine`

Run the 7-pass prompt refiner.

```sh
ctok refine "please could you kindly help me to handle the auth thing"
ctok refine -f prompt.txt
ctok refine "my prompt" --auto       # apply all suggestions automatically
ctok refine "my prompt" -i           # accept/reject each suggestion interactively
ctok refine "my prompt" -q           # print only the refined prompt
```

**Passes run (in order)**

1. `fillerStrip` — removes please/kindly/make sure/basically/etc.
2. `vagueVerbReplace` — replaces handle/fix/improve with concrete alternatives
3. `structureScaffold` — suggests GOAL/CONTEXT/CONSTRAINTS/OUTPUT template
4. `dedup` — removes near-duplicate paragraph blocks (≥80% Jaccard)
5. `fileRefCompression` — replaces large inline code blocks with `see path/file.ts:L1-90`
6. `outputFormatHint` — adds "Return as …" when no format is specified
7. `negativeCollapse` — condenses scattered "don't do X, avoid Y" into a `Do NOT:` list

---

## `ctok model`

Recommend the best model and effort level.

```sh
ctok model "Design a distributed event-sourcing system"
ctok model -f task.txt
```

---

## `ctok history`

View recent estimates.

```sh
ctok history              # last 20 entries
ctok history -n 50        # last 50
ctok history --csv        # export CSV
ctok history --clear      # clear all
```

## `ctok diff`

Compare two history entries.

```sh
ctok diff h1234567 h7654321
```

---

## `ctok config`

View or edit ctok configuration.

```sh
ctok config                       # show current config
ctok config get plan              # get a key
ctok config set plan max20x       # set plan
ctok config set telemetry true    # opt in to anonymous telemetry
ctok config edit                  # open config in $EDITOR
```

**Valid plan IDs**: `free`, `pro`, `max5x`, `max20x`, `team`, `enterprise`, `api`

---

## `ctok serve`

Launch the web playground locally on your machine.

```sh
ctok serve                  # serves on http://localhost:31337
ctok serve -p 8080          # custom port
```

Requires the `@ctok/web` static build (`packages/web/out/`) to be present. In a global npm install, if the web package is not bundled, the command opens ctok.dev instead.

---

## `ctok init`

Generate `.ctokignore` and `CLAUDE.md` template in the current directory.

```sh
ctok init
ctok init --force    # overwrite existing files
```

---

## `ctok doctor`

Diagnose ctok installation and configuration.

```sh
ctok doctor
```

Checks: Node version, config file, plan detection, Claude home, history.

---

## REPL

Running `ctok` with no arguments starts an interactive REPL that scans the current directory and lets you type prompts.

```sh
ctok
```
