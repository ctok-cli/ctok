import type { KnownBlock } from "@slack/bolt";
import type { CheckResult, ScanResult, RefineOutput } from "./types";

export function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function fmtUsd(n: number): string {
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

export function effortEmoji(effort: string): string {
  switch (effort) {
    case "low": return "🟢";
    case "medium": return "🟡";
    case "high": return "🟠";
    case "xhigh": return "🔴";
    default: return "⚪";
  }
}

export function buildCheckBlocks(r: CheckResult): KnownBlock[] {
  const { estimate, recommendation, suggestions, cost } = r;
  const effort = recommendation.effort.effort;
  const model = recommendation.model.model;

  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "⚡ ctok - Token Estimate", emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Input tokens*\n${fmtTokens(estimate.input.min)}-${fmtTokens(estimate.input.max)} (est. *${fmtTokens(estimate.input.expected)}*)` },
        { type: "mrkdwn", text: `*Output tokens*\n${fmtTokens(estimate.output.min)}-${fmtTokens(estimate.output.max)}` },
        { type: "mrkdwn", text: `*Total cost*\n${fmtUsd(cost.totalUsd)} (${fmtUsd(cost.totalUsdRange.min)}-${fmtUsd(cost.totalUsdRange.max)})` },
        { type: "mrkdwn", text: `*Confidence*\n${estimate.confidence}` },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${effortEmoji(effort)} *${effort}* effort → \`${model}\`\n_${recommendation.model.reason}_`,
      },
    },
  ];

  if (suggestions.length > 0) {
    const tips = suggestions
      .slice(0, 3)
      .map((s) => `• *${s.title}*: ${s.detail}`)
      .join("\n");
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Suggestions*\n${tips}` },
    });
  }

  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: "_Powered by <https://ctok-cli.github.io/ctok|ctok> - all analysis runs locally_" }],
  });

  return blocks;
}

export function buildRefineBlocks(r: RefineOutput, original: string): KnownBlock[] {
  const saved = fmtTokens(r.tokensSaved);
  return [
    {
      type: "header",
      text: { type: "plain_text", text: "✂️ ctok - Refined Prompt", emoji: true },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Tokens saved:* ~${saved} (${r.savedPct.toFixed(0)}% reduction)` },
    },
    { type: "divider" },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Refined prompt:*\n\`\`\`${r.refined.slice(0, 2900)}\`\`\`` },
    },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: "_Powered by <https://ctok-cli.github.io/ctok|ctok>_" }],
    },
  ];
}

export function buildScanBlocks(r: ScanResult, directory: string): KnownBlock[] {
  const topFiles = r.topHeavyFiles
    .slice(0, 8)
    .map((f) => `\`${f.path}\` - ${fmtTokens(f.tokens)} tok`)
    .join("\n");

  return [
    {
      type: "header",
      text: { type: "plain_text", text: "🔍 ctok - Project Scan", emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Directory*\n\`${directory}\`` },
        { type: "mrkdwn", text: `*Project type*\n${r.projectType}` },
        { type: "mrkdwn", text: `*Total files*\n${r.totalFiles}` },
        { type: "mrkdwn", text: `*Total tokens*\n${fmtTokens(r.estimatedTokens)}` },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Heaviest files:*\n${topFiles || "_No files found_"}` },
    },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: "_Powered by <https://ctok-cli.github.io/ctok|ctok>_" }],
    },
  ];
}

export function buildErrorBlock(message: string): KnownBlock[] {
  return [
    {
      type: "section",
      text: { type: "mrkdwn", text: `❌ *ctok error:* ${message}` },
    },
  ];
}

export function buildHelpBlocks(): KnownBlock[] {
  return [
    {
      type: "header",
      text: { type: "plain_text", text: "⚡ ctok - Claude Token Estimator", emoji: true },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: [
          "*Commands:*",
          "`/ctok check <prompt>` - Estimate tokens, cost, and get a model recommendation",
          "`/ctok refine <prompt>` - Run the 7-pass refiner to trim tokens and improve clarity",
          "`/ctok scan <path>` - Scan a directory and report its token footprint",
          "`/ctok help` - Show this message",
          "",
          "*Options (append to any command):*",
          "`--model haiku-4-5|sonnet-4-6|opus-4-7` - Override model for cost calculation",
          "`--plan free|pro|max5x|max20x` - Override plan for quota estimates",
          "`--task bug-fix|feature|refactor|review|...` - Hint for model recommendation",
        ].join("\n"),
      },
    },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: "<https://ctok-cli.github.io/ctok|ctok-cli.github.io/ctok> · <https://github.com/ctok-cli/ctok|GitHub>" }],
    },
  ];
}
