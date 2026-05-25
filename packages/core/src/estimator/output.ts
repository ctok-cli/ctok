import type { OutputEstimate, TaskType } from "../types";

interface OutputModel {
  ratioMin: number;
  ratioExpected: number;
  ratioMax: number;
  floor: number;
  ceiling: number;
}

const OUTPUT_MODELS: Record<TaskType, OutputModel> = {
  "bug-fix":     { ratioMin: 0.08, ratioExpected: 0.18, ratioMax: 0.45, floor: 200,  ceiling: 8_000  },
  feature:       { ratioMin: 0.2,  ratioExpected: 0.5,  ratioMax: 1.1,  floor: 400,  ceiling: 24_000 },
  refactor:      { ratioMin: 0.35, ratioExpected: 0.75, ratioMax: 1.5,  floor: 400,  ceiling: 32_000 },
  debugging:     { ratioMin: 0.06, ratioExpected: 0.15, ratioMax: 0.35, floor: 250,  ceiling: 6_000  },
  review:        { ratioMin: 0.04, ratioExpected: 0.1,  ratioMax: 0.25, floor: 200,  ceiling: 5_000  },
  documentation: { ratioMin: 0.12, ratioExpected: 0.3,  ratioMax: 0.7,  floor: 300,  ceiling: 10_000 },
  architecture:  { ratioMin: 0.15, ratioExpected: 0.35, ratioMax: 0.8,  floor: 600,  ceiling: 16_000 },
  general:       { ratioMin: 0.1,  ratioExpected: 0.25, ratioMax: 0.6,  floor: 200,  ceiling: 8_000  },
};

export function estimateOutput(
  inputTokens: number,
  taskType: TaskType,
): OutputEstimate {
  const m = OUTPUT_MODELS[taskType];
  const min = clamp(Math.round(inputTokens * m.ratioMin), m.floor, m.ceiling);
  const expected = clamp(Math.round(inputTokens * m.ratioExpected), m.floor, m.ceiling);
  const max = clamp(Math.round(inputTokens * m.ratioMax), m.floor, m.ceiling);
  return { min, expected, max };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
