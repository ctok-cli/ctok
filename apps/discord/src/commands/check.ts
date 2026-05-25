import type { ChatInputCommandInteraction } from "discord.js";
import { analyze } from "@ctok/core";
import { getQuotaImpact, type PlanId } from "@ctok/quota";
import type { ModelId, TaskType } from "@ctok/core";
import { buildCheckEmbed, buildQuotaField } from "../format";
import type { CheckResult } from "../types";

export async function handleCheck(interaction: ChatInputCommandInteraction): Promise<void> {
  const prompt = interaction.options.getString("prompt", true);
  const model = interaction.options.getString("model") ?? undefined;
  const plan = interaction.options.getString("plan") ?? undefined;
  const taskType = (interaction.options.getString("task_type") ?? "general") as TaskType;

  const modelId = (model || undefined) as ModelId | undefined;
  const result = analyze({ prompt, files: [], taskType }, modelId);

  const checkResult: CheckResult = {
    estimate: result.estimate,
    recommendation: result.recommendation,
    suggestions: result.suggestions,
    cost: result.cost,
  };

  const embed = buildCheckEmbed(checkResult);

  if (plan && plan !== "api") {
    try {
      const quota = getQuotaImpact({
        estimatedTokens: result.estimate.input.expected,
        model: result.recommendation.model.model,
        plan: plan as PlanId,
      });
      if (!quota.unlimited && quota.percentOf5hWindow !== null) {
        embed.addFields(buildQuotaField(quota.percentOf5hWindow, plan, quota.summary));
      }
    } catch {
      // unknown plan — skip quota
    }
  }

  await interaction.editReply({ embeds: [embed] });
}
