"use client";

import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import type { TaskType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TASKS: { id: TaskType; label: string; desc: string }[] = [
  { id: "bug-fix", label: "Bug fix", desc: "Localized correctness fix" },
  { id: "feature", label: "Feature", desc: "Net-new functionality" },
  { id: "refactor", label: "Refactor", desc: "Same behavior, better structure" },
  { id: "debugging", label: "Debugging", desc: "Investigate / root-cause" },
  { id: "review", label: "Code review", desc: "Read & critique only" },
  { id: "documentation", label: "Docs", desc: "Write / update prose" },
  { id: "architecture", label: "Architecture", desc: "Design / trade-offs" },
  { id: "general", label: "General", desc: "Something else" },
];

export function TaskTypeSelector() {
  const { taskType, setTaskType } = useApp();
  return (
    <Card
      title="Task type"
      subtitle="Drives output-length estimate, model pick, and effort suggestion."
    >
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {TASKS.map((t) => {
          const active = t.id === taskType;
          return (
            <button
              key={t.id}
              onClick={() => setTaskType(t.id)}
              className={cn(
                "flex flex-col items-start rounded-md border p-3 text-left transition-colors",
                active
                  ? "border-accent bg-accent/10"
                  : "border-border bg-bg-subtle hover:border-border-subtle hover:bg-bg-subtle/60",
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  active ? "text-accent" : "text-text",
                )}
              >
                {t.label}
              </span>
              <span className="mt-0.5 text-[11px] text-text-dim">{t.desc}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
