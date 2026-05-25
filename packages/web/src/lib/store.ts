"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ActualUsage,
  ContextFile,
  CostEstimate,
  EstimatorInput,
  ModelId,
  RecommendationResult,
  ReductionSuggestion,
  SessionEntry,
  TaskType,
  TokenEstimate,
} from "@ctok/core";
import { estimate as runEstimate } from "@ctok/core";
import { recommend as runRecommend } from "@ctok/core";
import { buildSuggestions } from "@ctok/core";
import { priceFor } from "@ctok/core";
import { uid } from "./utils";

interface ComputedOutputs {
  estimate: TokenEstimate;
  recommendation: RecommendationResult;
  suggestions: ReductionSuggestion[];
  cost: CostEstimate;
}

interface AppState {
  prompt: string;
  pastedCode: string;
  projectContext: string;
  files: ContextFile[];
  taskType: TaskType;
  selectedModelOverride: ModelId | null;
  history: SessionEntry[];
  // derived
  outputs: ComputedOutputs | null;

  setPrompt: (s: string) => void;
  setPastedCode: (s: string) => void;
  setProjectContext: (s: string) => void;
  setTaskType: (t: TaskType) => void;
  setSelectedModelOverride: (m: ModelId | null) => void;
  addFiles: (files: ContextFile[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  recompute: () => void;
  saveToHistory: () => string | null;
  recordActual: (entryId: string, actual: ActualUsage) => void;
  deleteHistoryEntry: (entryId: string) => void;
  clearHistory: () => void;
  reset: () => void;
  loadFromHash: (p?: string, c?: string, x?: string, t?: string) => void;
}

function computeOutputs(
  input: EstimatorInput,
  override: ModelId | null,
): ComputedOutputs {
  const estimate = runEstimate(input);
  const recommendation = runRecommend(input, estimate);
  const suggestions = buildSuggestions(input, estimate);
  const model = override ?? recommendation.model.model;
  const expectedPrice = priceFor(model, estimate.input.expected, estimate.output.expected);
  const minPrice = priceFor(model, estimate.input.min, estimate.output.min);
  const maxPrice = priceFor(model, estimate.input.max, estimate.output.max);
  const cost: CostEstimate = {
    model,
    inputUsd: expectedPrice.inputUsd,
    outputUsd: expectedPrice.outputUsd,
    totalUsd: expectedPrice.totalUsd,
    totalUsdRange: { min: minPrice.totalUsd, max: maxPrice.totalUsd },
  };
  return { estimate, recommendation, suggestions, cost };
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      prompt: "",
      pastedCode: "",
      projectContext: "",
      files: [],
      taskType: "general",
      selectedModelOverride: null,
      history: [],
      outputs: null,

      setPrompt: (s) => {
        set({ prompt: s });
        get().recompute();
      },
      setPastedCode: (s) => {
        set({ pastedCode: s });
        get().recompute();
      },
      setProjectContext: (s) => {
        set({ projectContext: s });
        get().recompute();
      },
      setTaskType: (t) => {
        set({ taskType: t });
        get().recompute();
      },
      setSelectedModelOverride: (m) => {
        set({ selectedModelOverride: m });
        get().recompute();
      },
      addFiles: (files) => {
        set((s) => ({ files: [...s.files, ...files] }));
        get().recompute();
      },
      removeFile: (id) => {
        set((s) => ({ files: s.files.filter((f) => f.id !== id) }));
        get().recompute();
      },
      clearFiles: () => {
        set({ files: [] });
        get().recompute();
      },
      recompute: () => {
        const s = get();
        if (
          !s.prompt.trim() &&
          !s.pastedCode.trim() &&
          !s.projectContext.trim() &&
          s.files.length === 0
        ) {
          set({ outputs: null });
          return;
        }
        const input: EstimatorInput = {
          prompt: s.prompt,
          pastedCode: s.pastedCode,
          projectContext: s.projectContext,
          files: s.files,
          taskType: s.taskType,
        };
        set({ outputs: computeOutputs(input, s.selectedModelOverride) });
      },
      saveToHistory: () => {
        const s = get();
        if (!s.outputs) return null;
        const id = uid("sess");
        const entry: SessionEntry = {
          id,
          createdAt: Date.now(),
          taskType: s.taskType,
          promptPreview: s.prompt.trim().slice(0, 240),
          estimate: s.outputs.estimate,
          recommendation: s.outputs.recommendation,
          cost: s.outputs.cost,
          suggestions: s.outputs.suggestions,
        };
        set((cur) => ({ history: [entry, ...cur.history].slice(0, 100) }));
        return id;
      },
      recordActual: (entryId, actual) => {
        set((cur) => ({
          history: cur.history.map((e) =>
            e.id === entryId ? { ...e, actual } : e,
          ),
        }));
      },
      deleteHistoryEntry: (entryId) => {
        set((cur) => ({ history: cur.history.filter((e) => e.id !== entryId) }));
      },
      clearHistory: () => set({ history: [] }),
      reset: () =>
        set({
          prompt: "",
          pastedCode: "",
          projectContext: "",
          files: [],
          taskType: "general",
          selectedModelOverride: null,
          outputs: null,
        }),
      loadFromHash: (p, c, x, t) => {
        const valid: TaskType[] = [
          "bug-fix","feature","refactor","debugging","review","documentation","architecture","general",
        ];
        set({
          prompt: p ?? "",
          pastedCode: c ?? "",
          projectContext: x ?? "",
          taskType: (valid.includes(t as TaskType) ? t : "general") as TaskType,
        });
        get().recompute();
      },
    }),
    {
      name: "ctok-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ history: s.history }),
    },
  ),
);
