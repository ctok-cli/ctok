---
title: Prompt Refiner
description: The 7-pass prompt refiner — how each pass works and what it targets.
---

The refiner runs a deterministic, offline 7-pass pipeline. Each pass is independent; the output of one feeds as input to the next.

## Pass 1 — `fillerStrip`

Removes politeness filler, intensifiers, and hedge phrases that add tokens without improving clarity.

**Examples removed:** `please`, `kindly`, `could you`, `very`, `really`, `just`, `basically`, `make sure to`, `ensure that`, `etc.`, `and so on`

```
Before: Please can you kindly help me to basically fix the auth issue.
After:  Fix the auth issue.
```

## Pass 2 — `vagueVerbReplace`

Replaces vague verbs with concrete alternatives the model can act on.

| Vague | Suggestions |
|-------|------------|
| `handle` | `validate \| process \| route` |
| `improve` | `optimize \| refactor \| simplify` |
| `fix it` | `correct the bug \| patch \| revert` |
| `work on` | `implement \| debug \| review` |
| `update` | `bump version \| patch \| edit` |

## Pass 3 — `structureScaffold`

Detects unstructured prompts (≥3 sentences, no headings or labeled sections) and suggests a `GOAL / CONTEXT / CONSTRAINTS / OUTPUT` template.

## Pass 4 — `dedup`

Splits the prompt into blocks on double newlines. Builds 4-word shingles per block and computes Jaccard similarity. Blocks with ≥80% shingle overlap are flagged as duplicates; the later one is removed.

## Pass 5 — `fileRefCompression`

Detects fenced code blocks that exceed ~300 tokens (~1,200 chars). Suggests replacing them with a compact file reference:

```
see `src/auth/middleware.ts:42-90`
```

Infers the file path from import statements, class declarations, or preceding text hints.

## Pass 6 — `outputFormatHint`

If the prompt requests code, a diff, a list, JSON, SQL, shell commands, or an explanation — but doesn't already specify a format — adds a one-line format hint:

```
Return as a unified diff.
Return as a fenced TypeScript code block.
```

## Pass 7 — `negativeCollapse`

Scatters "don't do X, avoid Y, never Z" into a compact `Do NOT:` list:

```
Before: Don't use any deprecated APIs and also don't hardcode secrets
        and never skip error handling.

After:  Do NOT:
        - use any deprecated APIs
        - hardcode secrets
        - skip error handling
```

## Specificity score (0–100)

After all passes, ctok scores the refined prompt on 7 dimensions:

| Dimension | Max points |
|-----------|-----------|
| Goal verb present | 20 |
| Concrete entities (file paths, function names) | 15 |
| Success criterion | 15 |
| Output format specified | 15 |
| Constraints listed | 10 |
| Do-not instructions | 10 |
| Code references (`see \`src/...\``) | 15 |

A score ≥ 70 is considered high-specificity. Scores below 30 usually produce inconsistent results from Claude.
