import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { AnalysisResult } from "@ctok/core";

export interface HistoryEntry {
  id: string;
  timestamp: string;
  prompt: string;
  projectRoot?: string;
  result: AnalysisResult;
}

function getHistoryPath(): string {
  const home = process.env["CTOK_HOME"] ?? path.join(os.homedir(), ".ctok");
  return path.join(home, "history.json");
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = fs.readFileSync(getHistoryPath(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
