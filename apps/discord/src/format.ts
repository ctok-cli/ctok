import { EmbedBuilder, Colors } from "discord.js";
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

function effortColor(effort: string): number {
  switch (effort) {
    case "low": return Colors.Green;
    case "medium": return Colors.Yellow;
    case "high": return Colors.Orange;
    case "xhigh": return Colors.Red;
    default: return Colors.Grey;
  }
}

export function buildCheckEmbed(r: CheckResult): EmbedBuilder {
  const { estimate, recommendation, suggestions, cost } = r;
  const effort = recommendation.effort.effort;
  const model = recommendation.model.model;

  const embed = new EmbedBuilder()
    .setTitle("⚡ ctok - Token Estimate")
    .setColor(effortColor(effort))
    .addFields(
      {
        name: "Input tokens",
        value: `${fmtTokens(estimate.input.min)}-${fmtTokens(estimate.input.max)}\nest. **${fmtTokens(estimate.input.expected)}**`,
        inline: true,
      },
      {
        name: "Output tokens",
        value: `${fmtTokens(estimate.output.min)}-${fmtTokens(estimate.output.max)}`,
        inline: true,
      },
      {
        name: "Total cost",
        value: `${fmtUsd(cost.totalUsd)}\n(${fmtUsd(cost.totalUsdRange.min)}-${fmtUsd(cost.totalUsdRange.max)})`,
        inline: true,
      },
      {
        name: "Confidence",
        value: estimate.confidence,
        inline: true,
      },
      {
        name: "Recommendation",
        value: `${effortEmoji(effort)} **${effort}** → \`${model}\`\n*${recommendation.model.reason}*`,
        inline: false,
      },
    )
    .setFooter({ text: "ctok - all analysis runs locally · ctok.dev" });

  if (suggestions.length > 0) {
    const tips = suggestions
      .slice(0, 3)
      .map((s) => `• **${s.title}**: ${s.detail}`)
      .join("\n");
    embed.addFields({ name: "Suggestions", value: tips, inline: false });
  }

  return embed;
}

export function buildQuotaField(pct: number, plan: string, summary: string): { name: string; value: string; inline: boolean } {
  return {
    name: `Quota impact (${plan})`,
    value: `${pct.toFixed(1)}% of 5h window\n*${summary}*`,
    inline: false,
  };
}

export function buildRefineEmbed(r: RefineOutput): EmbedBuilder {
  const saved = fmtTokens(r.tokensSaved);
  const refined = r.refined.length > 1800
    ? r.refined.slice(0, 1800) + "…"
    : r.refined;

  return new EmbedBuilder()
    .setTitle("✂️ ctok - Refined Prompt")
    .setColor(Colors.Green)
    .addFields(
      {
        name: "Tokens saved",
        value: `~${saved} (${r.savedPct.toFixed(0)}% reduction)`,
        inline: true,
      },
      {
        name: "Refined prompt",
        value: `\`\`\`\n${refined}\n\`\`\``,
        inline: false,
      },
    )
    .setFooter({ text: "ctok - all analysis runs locally · ctok.dev" });
}

export function buildScanEmbed(r: ScanResult, directory: string): EmbedBuilder {
  const topFiles = r.topHeavyFiles
    .slice(0, 8)
    .map((f) => `\`${f.path}\` - ${fmtTokens(f.tokens)} tok`)
    .join("\n") || "_No files found_";

  return new EmbedBuilder()
    .setTitle("🔍 ctok - Project Scan")
    .setColor(Colors.Blue)
    .addFields(
      { name: "Directory", value: `\`${directory}\``, inline: true },
      { name: "Project type", value: r.projectType, inline: true },
      { name: "Total files", value: String(r.totalFiles), inline: true },
      { name: "Total tokens", value: fmtTokens(r.estimatedTokens), inline: true },
      { name: "Heaviest files", value: topFiles, inline: false },
    )
    .setFooter({ text: "ctok - all analysis runs locally · ctok.dev" });
}

export function buildErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("❌ ctok Error")
    .setColor(Colors.Red)
    .setDescription(message.slice(0, 2000));
}

export function buildHelpEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("⚡ ctok - Claude Token Estimator")
    .setColor(Colors.Blurple)
    .setDescription("Estimate Claude token usage, cost, and quota impact without leaving Discord.")
    .addFields(
      {
        name: "Commands",
        value: [
          "`/ctok check prompt:<text>` - Token estimate + cost + model recommendation",
          "`/ctok refine prompt:<text>` - Run the 7-pass prompt refiner",
          "`/ctok scan directory:<path>` - Scan a project and report token footprint",
          "`/ctok help` - Show this message",
        ].join("\n"),
        inline: false,
      },
      {
        name: "Optional parameters (for /ctok check)",
        value: [
          "`model` - Override model (`haiku-4-5`, `sonnet-4-6`, `opus-4-7`)",
          "`plan` - Override plan (`free`, `pro`, `max5x`, `max20x`)",
          "`task_type` - Task hint (`bug-fix`, `feature`, `refactor`, `review`, …)",
        ].join("\n"),
        inline: false,
      },
    )
    .setFooter({ text: "ctok.dev · github.com/ctok-cli/ctok" });
}
