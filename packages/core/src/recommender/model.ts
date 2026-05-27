import type {
  ComplexityBreakdown,
  ModelId,
  ModelRecommendation,
  TaskType,
} from "../types";
import { PRICING } from "../pricing";

export function recommendModel(
  complexity: ComplexityBreakdown,
  taskType: TaskType,
  inputTokens: number,
): ModelRecommendation {
  let primary: ModelId;
  let reason: string;
  const alts: { model: ModelId; reason: string }[] = [];

  if (complexity.band === "simple") {
    primary = "haiku-4-5";
    reason =
      "Task is low-complexity (rename / cosmetic / single-file docs). Haiku is fast, cheap, and accurate for narrow edits.";
    alts.push({
      model: "sonnet-4-6",
      reason: "Upgrade if the task turns out to span multiple files or needs careful reasoning.",
    });
  } else if (complexity.band === "normal") {
    primary = "sonnet-4-6";
    reason =
      "Standard coding task - Sonnet 4.6 is the right balance of quality and cost for typical features and bug fixes.";
    alts.push(
      { model: "haiku-4-5", reason: "Drop to Haiku if you only need quick edits or many cheap iterations." },
      { model: "opus-4-7",  reason: "Escalate to Opus if early Sonnet attempts miss requirements or the bug is subtle." },
    );
  } else {
    primary = "opus-4-7";
    reason =
      "Deep / architectural / cross-cutting work. Opus 4.7 has the strongest reasoning and is worth the premium when correctness is critical.";
    alts.push({
      model: "sonnet-4-6",
      reason: "Use Sonnet for the implementation passes once Opus has produced the plan.",
    });
  }

  if (taskType === "documentation" && primary !== "haiku-4-5") {
    alts.unshift({
      model: "haiku-4-5",
      reason: "Documentation rewrites are usually fine on Haiku - significantly cheaper at high output volume.",
    });
  }

  if (inputTokens > 150_000 && primary !== "opus-4-7") {
    reason +=
      " Note: your input is large (>150k tokens) - consider Opus for better long-context reasoning, or trim context first.";
  }

  return {
    model: primary,
    reason,
    alternatives: alts.filter((a) => a.model !== primary),
  };
}

export function modelLabel(m: ModelId) {
  return PRICING[m].label;
}
