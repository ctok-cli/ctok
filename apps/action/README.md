# ctok GitHub Action

Estimate Claude token usage, cost, and quota impact in CI. Optionally fail the workflow when a prompt exceeds token or cost thresholds.

## Usage

```yaml
- name: Check prompt tokens
  uses: ctok-cli/ctok@v0.1.0
  with:
    file: prompts/my-prompt.md
    plan: pro
    max-tokens: 50000
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `prompt` | No | `""` | Prompt text to analyse. |
| `file` | No | `""` | Path to a file containing the prompt. |
| `model` | No | `""` | Override model (`haiku-4-5`, `sonnet-4-6`, `opus-4-7`). Auto-selects if empty. |
| `plan` | No | `pro` | Claude plan: `free`, `pro`, `max5x`, `max20x`, `team`, `enterprise`, `api`. |
| `task-type` | No | `general` | Task hint: `general`, `bug-fix`, `feature`, `refactor`, `review`, `architecture`, `debugging`, `docs`, `test`. |
| `max-tokens` | No | `""` | Fail if input token count exceeds this. |
| `max-cost-usd` | No | `""` | Fail if estimated cost (USD) exceeds this. |
| `refine` | No | `false` | Run the 7-pass prompt refiner and set `refined-prompt` / `tokens-saved` outputs. |

Either `prompt` or `file` must be provided.

## Outputs

| Output | Description |
|--------|-------------|
| `input-tokens` | Estimated input token count. |
| `output-tokens` | Estimated output token count. |
| `total-tokens` | Total estimated tokens (input + output). |
| `input-cost-usd` | Estimated input cost in USD. |
| `output-cost-usd` | Estimated output cost in USD. |
| `total-cost-usd` | Estimated total cost in USD. |
| `model` | Model used for cost calculation. |
| `recommended-model` | Recommended model for this prompt. |
| `recommended-effort` | Recommended effort level (`low`, `medium`, `high`, `xhigh`). |
| `confidence` | Token estimate confidence (`high`, `medium`, `low`). |
| `quota-pct` | Estimated % of your 5-hour quota window consumed. |
| `suggestions` | JSON array of reduction suggestions. |
| `refined-prompt` | Refined prompt text (only when `refine: true`). |
| `tokens-saved` | Tokens saved by the refiner (only when `refine: true`). |

## Examples

### Fail if prompt is too large

```yaml
- uses: ctok-cli/ctok@v0.1.0
  with:
    file: context/big-prompt.md
    max-tokens: 30000
    max-cost-usd: "0.25"
```

### Refine and print savings

```yaml
- uses: ctok-cli/ctok@v0.1.0
  id: ctok
  with:
    prompt: "please help me to fix the thing"
    refine: "true"

- run: echo "Saved ${{ steps.ctok.outputs.tokens-saved }} tokens"
```

### Use outputs in subsequent steps

```yaml
- uses: ctok-cli/ctok@v0.1.0
  id: ctok
  with:
    file: prompts/deploy-review.md
    plan: max5x

- name: Skip expensive model if prompt is simple
  if: steps.ctok.outputs.recommended-effort == 'low'
  run: echo "Use Haiku for this prompt"
```

## Job summary

Every run writes a Markdown table to the GitHub Actions job summary with the full analysis — token ranges, cost breakdown, recommendation, and suggestions.

## Privacy

All analysis runs locally inside the GitHub runner. No prompt text is sent to ctok.dev or any external service. The action bundles `@ctok/core`, `@ctok/refiner`, and `@ctok/quota` directly into `dist/index.js`.
