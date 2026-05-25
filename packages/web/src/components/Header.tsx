"use client";

import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Save, RotateCcw, Zap } from "lucide-react";

export function Header() {
  const { outputs, saveToHistory, reset } = useApp();
  const canSave = !!outputs;
  return (
    <header className="border-b border-border-subtle bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-accent/15 text-accent">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-text">
              ctok
            </h1>
            <p className="text-xs text-text-muted">
              Lighthouse for Claude prompts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => reset()}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!canSave}
            onClick={() => saveToHistory()}
          >
            <Save className="h-3.5 w-3.5" /> Save snapshot
          </Button>
        </div>
      </div>
    </header>
  );
}
