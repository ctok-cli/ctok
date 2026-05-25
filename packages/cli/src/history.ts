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

const MAX_ENTRIES = 100;

let idCounter = 0;
let lastIdMs = 0;

function nextId(): string {
  const now = Date.now();
  if (now === lastIdMs) {
    idCounter += 1;
  } else {
    lastIdMs = now;
    idCounter = 0;
  }
  return idCounter === 0 ? `h${now}` : `h${now}-${idCounter}`;
}

function getHistoryPath(): string {
  const home = process.env["CTOK_HOME"] ?? path.join(os.homedir(), ".ctok");
  return path.join(home, "history.json");
}

function load(): HistoryEntry[] {
  try {
    const raw = fs.readFileSync(getHistoryPath(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(entries: HistoryEntry[]): void {
  const p = getHistoryPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(entries.slice(-MAX_ENTRIES), null, 2) + "\n", "utf8");
}

export function appendHistory(entry: Omit<HistoryEntry, "id" | "timestamp">): HistoryEntry {
  const existing = load();
  const full: HistoryEntry = {
    ...entry,
    id: nextId(),
    timestamp: new Date().toISOString(),
  };
  save([...existing, full]);
  return full;
}

export function getHistory(limit = 20): HistoryEntry[] {
  return load().slice(-limit).reverse();
}

export function getHistoryEntry(id: string): HistoryEntry | undefined {
  return load().find((e) => e.id === id);
}

export function clearHistory(): void {
  save([]);
}

export function historyToCsv(entries: HistoryEntry[]): string {
  const header = "id,timestamp,prompt,inputTokens,outputTokens,model,totalUsd";
  const rows = entries.map((e) => {
    const cols = [
      e.id,
      e.timestamp,
      `"${e.prompt.replace(/"/g, '""').slice(0, 80)}"`,
      e.result.estimate.input.expected,
      e.result.estimate.output.expected,
      e.result.recommendation.model.model,
      e.result.cost.totalUsd.toFixed(6),
    ];
    return cols.join(",");
  });
  return [header, ...rows].join("\n");
}
