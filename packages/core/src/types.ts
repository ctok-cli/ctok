export type TaskType =
  | "bug-fix"
  | "feature"
  | "refactor"
  | "debugging"
  | "review"
  | "documentation"
  | "architecture"
  | "general";

export type ModelId = "haiku-4-5" | "sonnet-4-6" | "opus-4-7";
export type EffortLevel = "low" | "medium" | "high" | "xhigh";

export interface ContextFile {
  id: string;
  name: string;
  content: string;
  language?: string;
  bytes: number;
}

export interface EstimatorInput {
  prompt: string;
  pastedCode?: string;
  files: ContextFile[];
  projectContext?: string;
  taskType: TaskType;
}

export type ContentKind =
  | "prose"
  | "code"
  | "json"
  | "markdown"
  | "log"
  | "diff"
  | "minified";

export interface ChunkAnalysis {
  label: string;
  kind: ContentKind;
  chars: number;
  tokens: number;
  ratio: number;
}

export interface OutputEstimate {
  min: number;
  expected: number;
  max: number;
}

export interface TokenEstimate {
  input: {
    min: number;
    expected: number;
    max: number;
  };
  output: OutputEstimate;
  totalExpected: number;
  confidence: "high" | "medium" | "low";
  chunks: ChunkAnalysis[];
}

export interface ReductionSuggestion {
  id: string;
  title: string;
  detail: string;
  estimatedSavingTokens: number;
  severity: "info" | "warn" | "danger";
  action: string;
  target?: string;
}

export interface ModelRecommendation {
  model: ModelId;
  reason: string;
  alternatives: { model: ModelId; reason: string }[];
}

export interface EffortRecommendation {
  effort: EffortLevel;
  reason: string;
}

export interface ComplexityBreakdown {
  score: number;
  signals: { label: string; weight: number }[];
  band: "simple" | "normal" | "deep";
}

export interface RecommendationResult {
  complexity: ComplexityBreakdown;
  model: ModelRecommendation;
  effort: EffortRecommendation;
}

export interface CostEstimate {
  model: ModelId;
  inputUsd: number;
  outputUsd: number;
  totalUsd: number;
  totalUsdRange: { min: number; max: number };
}

export interface ActualUsage {
  inputTokens: number;
  outputTokens: number;
  model?: ModelId;
}

export interface SessionEntry {
  id: string;
  createdAt: number;
  taskType: TaskType;
  promptPreview: string;
  estimate: TokenEstimate;
  recommendation: RecommendationResult;
  cost: CostEstimate;
  suggestions: ReductionSuggestion[];
  actual?: ActualUsage;
}

/** Returned by the top-level `analyze()` function — everything in one object. */
export interface AnalysisResult {
  estimate: TokenEstimate;
  recommendation: RecommendationResult;
  suggestions: ReductionSuggestion[];
  cost: CostEstimate;
}
