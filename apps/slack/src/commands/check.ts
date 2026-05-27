import { analyze } from "@ctok/core";
import { getQuotaImpact, type PlanId } from "@ctok/quota";
import type { ModelId, TaskType } from "@ctok/core";
import type { RespondFn, CheckResult, ParsedArgs } from "../types";
import { buildCheckBlocks } from "../format";

export async function handleCheck(args: ParsedArgs, respond: RespondFn): Promise<void> {
  if (!args.text) {
    await respond({
      blocks: [{ type: "section", text: { type: "mrkdwn", text: "Usage: `/ctok check <your prompt here>`" } }],
    });
    return;
  }

  const modelId = (args.model || undefined) as ModelId | undefined;
  const taskType = (args.taskType || "general") as TaskType;

  const result = analyze({ prompt: args.text, files: [], taskType }, modelId);

  const checkResult: CheckResult = {
    estimate: result.estimate,
    recommendation: result.recommendation,
    suggestions: result.suggestions,
    cost: result.cost,
  };

  const blocks = buildCheckBlocks(checkResult);

  if (args.plan && args.plan !== "api") {
    try {
      const quota = getQuotaImpact({
        estimatedTokens: result.estimate.input.expected,
        model: result.recommendation.model.model,
        plan: args.plan as PlanId,
      });
      if (!quota.unlimited && quota.percentOf5hWindow !== null) {
        blocks.splice(blocks.length - 1, 0, {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Quota impact (${args.plan}):* ${quota.percentOf5hWindow.toFixed(1)}% of 5h window\n_${quota.summary}_`,
          },
        });
      }
    } catch {
      // unknown plan - skip quota section
    }
  }

  await respond({ blocks, response_type: "in_channel" });
}
