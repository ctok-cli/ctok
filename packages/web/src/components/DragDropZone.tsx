"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { isTauri, listenDragDrop, invokeScanFolder } from "@/lib/tauri";
import type { FolderScan } from "@/lib/tauri";
import { FolderTree, Loader2 } from "lucide-react";

export function DragDropZone() {
  const [active, setActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<FolderScan | null>(null);
  const setPrompt = useApp((s) => s.setPrompt);

  useEffect(() => {
    if (!isTauri()) return;

    let unlisten: (() => void) | undefined;

    listenDragDrop(async (path) => {
      setActive(false);
      setScanning(true);
      try {
        const scan = await invokeScanFolder(path);
        setLastScan(scan);
        // Inject scan summary into prompt context
        const summary = buildScanSummary(scan);
        setPrompt(summary);
      } catch (err) {
        console.error("scan_folder error:", err);
      } finally {
        setScanning(false);
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => unlisten?.();
  }, [setPrompt]);

  if (!isTauri()) return null;

  return (
    <div
      className={`relative flex items-center gap-3 rounded-lg border-2 border-dashed px-4 py-3 text-sm transition-colors ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border text-text-muted hover:border-border-subtle"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setActive(false);
      }}
    >
      {scanning ? (
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
      ) : (
        <FolderTree className="h-4 w-4 shrink-0" />
      )}
      <span>
        {scanning
          ? "Scanning project…"
          : lastScan
            ? `${lastScan.root.split("/").pop()} — ${lastScan.total_files} files, ~${(lastScan.estimated_tokens / 1000).toFixed(1)}k tokens`
            : "Drop a project folder here to scan its token footprint"}
      </span>
    </div>
  );
}

function buildScanSummary(scan: FolderScan): string {
  const topExts = Object.entries(scan.by_extension)
    .sort((a, b) => b[1].tokens - a[1].tokens)
    .slice(0, 5)
    .map(([ext, s]) => `.${ext}: ${s.files} files (~${Math.round(s.tokens / 1000)}k tok)`)
    .join("\n");

  const heaviest = scan.top_heavy_files
    .slice(0, 5)
    .map((f) => `  ${f.path} (~${Math.round(f.tokens / 1000)}k tok)`)
    .join("\n");

  return `Project scan: ${scan.root.split("/").pop()}
Total: ${scan.total_files} files · ~${Math.round(scan.estimated_tokens / 1000)}k tokens

Top file types:
${topExts}

Heaviest files:
${heaviest}

[Add your prompt below — the scan above gives Claude project context]`;
}
