"use client";

import { ChangeEvent, useRef } from "react";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatNumber, truncate, uid } from "@/lib/utils";
import { estimateTokensFor } from "@/lib/estimator/tokenize";
import type { ContextFile } from "@/lib/types";
import { X, Upload, FolderTree } from "lucide-react";

const MAX_BYTES_PER_FILE = 2_000_000; // 2 MB

export function FilePicker() {
  const { files, addFiles, removeFile, clearFiles } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list) return;
    const next: ContextFile[] = [];
    for (const f of Array.from(list)) {
      if (f.size > MAX_BYTES_PER_FILE) {
        next.push({
          id: uid("file"),
          // Use webkitRelativePath if present (folder picker)
          name: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name,
          content: `// [skipped: ${f.size.toLocaleString()} bytes > limit. Provide a smaller excerpt instead.]`,
          bytes: f.size,
        });
        continue;
      }
      try {
        const content = await f.text();
        next.push({
          id: uid("file"),
          name: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name,
          content,
          bytes: f.size,
        });
      } catch (err) {
        console.error("Failed to read file", f.name, err);
      }
    }
    if (next.length > 0) addFiles(next);
    if (e.target) e.target.value = "";
  }

  return (
    <Card
      title="Context files"
      subtitle="Attach files Claude would see in its context. Stays local in the browser."
      action={
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" /> Files
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => folderRef.current?.click()}
          >
            <FolderTree className="h-3.5 w-3.5" /> Folder
          </Button>
          {files.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => clearFiles()}>
              Clear
            </Button>
          )}
        </div>
      }
    >
      <input
        ref={fileRef}
        type="file"
        multiple
        hidden
        onChange={onFiles}
      />
      <input
        ref={folderRef}
        type="file"
        multiple
        hidden
        onChange={onFiles}
        // @ts-expect-error non-standard attributes for directory selection
        webkitdirectory=""
        directory=""
      />

      {files.length === 0 ? (
        <p className="text-sm text-text-dim">
          No files attached. Drop in the files you'd realistically include — usually 1–4 is enough.
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {files.map((f) => {
            const ext = f.name.includes(".") ? f.name.split(".").pop() : undefined;
            const meta = estimateTokensFor(f.content, ext, f.name);
            return (
              <li key={f.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-sm text-text" title={f.name}>
                      {truncate(f.name, 60)}
                    </span>
                    <Badge tone="neutral">{meta.kind}</Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-text-dim">
                    {formatNumber(f.content.length)} chars · ~{formatNumber(meta.tokens)} tokens
                  </div>
                </div>
                <button
                  className="rounded p-1 text-text-dim hover:bg-bg-subtle hover:text-danger"
                  onClick={() => removeFile(f.id)}
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
