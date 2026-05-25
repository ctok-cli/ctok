---
title: Token Estimation
description: How ctok estimates token usage without calling the Claude API.
---

ctok uses a heuristic BPE-aware estimator. It doesn't call the Claude API - everything runs locally in microseconds.

## How it works

1. **Split into chunks** - prompt, pasted code, project context, and each attached file are treated separately.

2. **Classify content kind** - each chunk is classified as one of: `prose`, `code`, `json`, `markdown`, `log`, `diff`, or `minified`. Classification uses file extension hints and regex patterns on the content.

3. **Apply chars-per-token ratio** - each kind has a calibrated ratio:

   | Kind | Ratio | Notes |
   |------|-------|-------|
   | Prose | 4.5 chars/tok | Natural language |
   | Code | 3.5 chars/tok | Identifiers, operators |
   | JSON | 3.0 chars/tok | Keys, punctuation |
   | Markdown | 4.2 chars/tok | Similar to prose |
   | Log | 3.0 chars/tok | Timestamps, paths |
   | Diff | 3.2 chars/tok | `+`/`-` lines |
   | Minified | 2.5 chars/tok | Packed JS/CSS |

4. **Symbol-density adjustment** - adds ~12% for code and JSON (BPE splits punctuation and operators into individual tokens).

5. **Add system overhead** - ~350 tokens for Claude Code's scaffold.

6. **Compute range** - each chunk is widened by a kind-specific variance factor. Ranges are summed independently.

7. **Set confidence**:
   - `high` - single-kind, under 50k tokens
   - `medium` - mixed kinds or over 50k
   - `low` - minified content present, or over 100k tokens

## Output token model

Output tokens are estimated as `inputTokens × ratio`, where the ratio varies by task type:

| Task type | Output ratio |
|-----------|-------------|
| `feature` | 1.4× |
| `refactor` | 1.2× |
| `bug-fix` | 0.8× |
| `review` | 0.6× |
| `documentation` | 1.0× |
| `architecture` | 1.0× |
| `debugging` | 0.9× |
| `general` | 1.0× |

Absolute floor: 150 tokens. Ceiling: 8,000 tokens for most tasks.

## Accuracy

In testing against real Claude Code sessions, the estimator hits within ±20% for 85%+ of typical prompts. Outliers are:
- Very short prompts (< 50 tokens) - variance is high
- Minified/compressed content - ratio is approximate
- Mixed-language code (e.g. SQL inside Python strings)

The ranges are designed to contain the true value ~90% of the time.

## Replacing the estimator

To swap in Anthropic's real `count_tokens` API: replace `estimateTokensFor()` in `packages/core/src/estimator/tokenize.ts`. Everything downstream (chunks, ranges, recommender, reducer) works unchanged.
