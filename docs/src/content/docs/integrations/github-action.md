---
title: GitHub Action
description: Use the ctok GitHub Action to enforce token budgets and add cost annotations to pull requests.
---

The `ctok-cli/ctok-action` GitHub Action runs token estimation inside CI, adding cost annotations to pull requests and optionally blocking merges that exceed a token budget.

## Quick start

```yaml
# .github/workflows/ctok.yml
name: Token budget check
on: [pull_request]

jobs:
  ctok:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ctok-cli/ctok-action@v1
        with:
          path: .
          budget-tokens: 50000
```

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `path` | `.` | Directory to scan |
| `budget-tokens` | _(none)_ | Fail the step if estimated tokens exceed this value |
| `model` | _(auto)_ | Model for cost calculation |
| `plan` | `api` | Plan for quota estimates |
| `comment-on-pr` | `true` | Post a summary comment on pull requests |

## Outputs

| Output | Description |
|--------|-------------|
| `estimated-tokens` | Total estimated token count |
| `estimated-cost-usd` | Estimated cost in USD |
| `recommended-model` | Recommended Claude model |
| `project-type` | Detected project type |

## PR comment

When `comment-on-pr: true` (default), the action posts a summary table as a PR comment:

```
## ctok token estimate

| Metric | Value |
|--------|-------|
| Estimated tokens | 23,400 |
| Estimated cost | $0.07 |
| Recommended model | sonnet-4-6 |
| Project type | typescript |
```

## Budget gate example

Block PRs that would exceed 50k tokens:

```yaml
- uses: ctok-cli/ctok-action@v1
  with:
    path: src/
    budget-tokens: 50000
    comment-on-pr: true
```

If the scan returns > 50,000 tokens, the step exits with code 1 and the workflow fails.

## Use outputs in later steps

```yaml
- uses: ctok-cli/ctok-action@v1
  id: ctok
  with:
    path: .

- run: |
    echo "Tokens: ${{ steps.ctok.outputs.estimated-tokens }}"
    echo "Cost: ${{ steps.ctok.outputs.estimated-cost-usd }}"
```
