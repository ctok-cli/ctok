"use client";

import { Header } from "./Header";
import { Hero } from "./Hero";
import { HashSync } from "./HashSync";
import { PromptInput } from "./PromptInput";
import { TaskTypeSelector } from "./TaskTypeSelector";
import { TokenMeter } from "./TokenMeter";
import { CostIndicator } from "./CostIndicator";
import { ModelRecommendation } from "./ModelRecommendation";
import { EffortRecommendation } from "./EffortRecommendation";
import { ReductionSuggestions } from "./ReductionSuggestions";
import { SessionHistory } from "./SessionHistory";
import { DragDropZone } from "./DragDropZone";
import { FilePicker } from "./FilePicker";
import { RefinerPanel } from "./RefinerPanel";
import { QuotaIndicator } from "./QuotaIndicator";

export function Dashboard() {
  return (
    <div className="min-h-screen bg-bg">
      <HashSync />
      <Header />
      <Hero />
      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left column - inputs */}
          <div className="space-y-6 lg:col-span-3">
            <DragDropZone />
            <FilePicker />
            <div id="prompt-input">
              <PromptInput />
            </div>
            <TaskTypeSelector />
            <SessionHistory />
          </div>

          {/* Right column - outputs */}
          <div className="space-y-6 lg:col-span-2">
            <TokenMeter />
            <CostIndicator />
            <QuotaIndicator />
            <ModelRecommendation />
            <EffortRecommendation />
            <ReductionSuggestions />
            <RefinerPanel />
          </div>
        </div>

        <footer className="mt-10 border-t border-border-subtle pt-6 text-xs text-text-dim">
          <p>
            Token counts are heuristic estimates calibrated against Claude&apos;s
            BPE behavior - treat them as ranges. Local-only: nothing leaves
            your browser. Pricing reflects Anthropic list rates and may drift.
          </p>
        </footer>
      </main>
    </div>
  );
}
