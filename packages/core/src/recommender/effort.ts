import type {
  ComplexityBreakdown,
  EffortLevel,
  EffortRecommendation,
  TaskType,
} from "../types";

export function recommendEffort(
  complexity: ComplexityBreakdown,
  taskType: TaskType,
): EffortRecommendation {
  let effort: EffortLevel;
  let reason: string;

  if (complexity.band === "simple") {
    effort = "low";
    reason =
      "Low complexity - low effort keeps responses tight and saves tokens. Bump up only if the result misses the mark.";
  } else if (complexity.band === "normal") {
    effort = "medium";
    reason =
      "Standard complexity - medium effort gives Claude room to verify its work without over-running on tokens.";
  } else {
    effort = "high";
    reason =
      "Deep / architectural work benefits from extra thinking. High effort improves correctness on subtle bugs and trade-off reasoning.";
  }

  if (taskType === "debugging" && complexity.band !== "simple") {
    effort = "high";
    reason =
      "Debugging rewards extra reasoning - root causes are often non-obvious. High effort pays for itself by avoiding wrong fixes.";
  }
  if (taskType === "documentation" && complexity.band !== "deep") {
    effort = "low";
    reason =
      "Documentation is mostly transformation, not reasoning. Low effort is usually enough and meaningfully cheaper at output scale.";
  }
  if (taskType === "review" && complexity.band !== "deep") {
    effort = complexity.band === "simple" ? "low" : "medium";
    reason =
      "Code review is scoped scanning - start at low/medium effort and only escalate if you want broader, more speculative coverage.";
  }
  if (taskType === "architecture") {
    effort = "xhigh";
    reason =
      "Architecture decisions are hard to reverse. Maximum effort surfaces trade-offs and hidden coupling that lower settings often miss.";
  }

  return { effort, reason };
}
