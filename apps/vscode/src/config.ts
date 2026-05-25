import * as vscode from "vscode";
import type { TaskType } from "@ctok/core";

export interface CtokConfig {
  plan: string;
  model: string;
  showStatusBar: boolean;
  autoAnalyze: boolean;
  taskType: TaskType;
}

export function getConfig(): CtokConfig {
  const cfg = vscode.workspace.getConfiguration("ctok");
  return {
    plan: cfg.get<string>("plan", "pro"),
    model: cfg.get<string>("model", ""),
    showStatusBar: cfg.get<boolean>("showStatusBar", true),
    autoAnalyze: cfg.get<boolean>("autoAnalyze", true),
    taskType: cfg.get<TaskType>("taskType", "general"),
  };
}
