"use client";

// Detect whether we're running inside a Tauri webview
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export interface FileStat {
  path: string;
  bytes: number;
  tokens: number;
  ext: string;
}

export interface FolderScan {
  root: string;
  total_files: number;
  total_bytes: number;
  estimated_tokens: number;
  top_heavy_files: FileStat[];
  by_extension: Record<string, { files: number; tokens: number }>;
  excluded_count: number;
}

// Dynamically import Tauri APIs only when running in the desktop app.
// In a browser build these imports never execute.

export async function invokeScanFolder(path: string): Promise<FolderScan> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<FolderScan>("scan_folder", { path });
}

export async function listenDragDrop(
  callback: (path: string) => void,
): Promise<() => void> {
  const { listen } = await import("@tauri-apps/api/event");
  const unlisten = await listen<string>("ctok://drag-drop", (event) => {
    callback(event.payload);
  });
  return unlisten;
}
