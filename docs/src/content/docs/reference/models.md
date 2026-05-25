---
title: Model Recommendations
description: How ctok picks the right Claude model and effort level.
---

## Complexity score (0–100)

ctok computes a complexity score from the input before picking a model:

| Signal | Max weight |
|--------|-----------|
| Task type base (`bug-fix` → `architecture`) | 12–60 |
| Input volume (log-scaled) | 35 |
| File breadth (number of attached files) | 20 |
| Content heterogeneity (≥3 kinds) | 6 |
| Keyword signals (`security`, `distributed`, `migrate`, …) | ±12 each |
| Large expected output | 8 |

**Bands:** `simple` < 30 ≤ `normal` < 65 ≤ `deep`

## Model selection

| Band | Recommended model | Why |
|------|------------------|-----|
| Simple | `haiku-4-5` | Narrow edits, cosmetic, docs — Haiku is fast and cheap. |
| Normal | `sonnet-4-6` | The default workhorse — strong reasoning, good price. |
| Deep | `opus-4-7` | Architecture, hairy bugs, cross-cutting refactors. Worth the premium. |

When input exceeds 150k tokens, the recommender nudges toward Sonnet or Opus regardless of complexity band (long-context tasks benefit from stronger models).

## Effort levels

Effort starts from the complexity band and is adjusted by task type:

| Task type | Adjustment |
|-----------|-----------|
| `architecture` | → `xhigh` |
| `debugging` | → `high` |
| `feature` | +1 level from band |
| `review` | → `low` or `medium` |
| `documentation` | → `low` |
| `bug-fix` | no override |
| `refactor` | no override |
| `general` | no override |

**Levels:** `low` → `medium` → `high` → `xhigh`

## Pricing reference

| Model | Input | Output |
|-------|-------|--------|
| `haiku-4-5` | $0.80/M | $4.00/M |
| `sonnet-4-6` | $3.00/M | $15.00/M |
| `opus-4-7` | $15.00/M | $75.00/M |

*Anthropic list rates as of May 2026. ctok shows estimates only — verify at [anthropic.com/pricing](https://www.anthropic.com/pricing).*
