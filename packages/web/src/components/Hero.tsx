"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { TaskType } from "@/lib/types";
import { Terminal } from "lucide-react";
import { CtokIcon } from "@/components/CtokIcon";

const INSTALL_TABS = [
  {
    id: "npm",
    label: "npm",
    cmd: "npm install -g ctok",
  },
  {
    id: "curl",
    label: "curl",
    cmd: 'curl -fsSL https://ctok-cli.github.io/ctok/install.sh | sh',
  },
  {
    id: "ps",
    label: "PowerShell",
    cmd: 'irm https://ctok-cli.github.io/ctok/install.ps1 | iex',
  },
] as const;

const EXAMPLES: {
  title: string;
  scenario: string;
  prompt: string;
  taskType: TaskType;
}[] = [
  {
    title: "Refactor middleware",
    scenario: "Auth overhaul",
    prompt:
      "Refactor the auth middleware in src/middleware/auth.ts to use the new SessionStore class introduced in PR #412. Keep the existing public API surface - only swap the internal storage layer. Add a migration shim for existing sessions so live users aren't logged out on deploy.",
    taskType: "refactor",
  },
  {
    title: "Debug race condition",
    scenario: "Duplicate charges",
    prompt:
      "There's a race condition in src/payments/processor.ts:handleCharge - two concurrent requests for the same user sometimes create duplicate charges. The DB is Postgres with read-committed isolation. Diagnose the root cause and propose a fix (advisory lock, idempotency key, or serializable tx). Show the exact code change.",
    taskType: "debugging",
  },
  {
    title: "Add API endpoint",
    scenario: "Avatar upload",
    prompt:
      "Add POST /api/users/:id/avatar to the Express 5 app. Accept multipart/form-data with a single image field (jpg / png / webp, max 5 MB). Resize to 256×256, upload to the S3 bucket in src/config/storage.ts, update the user record's avatarUrl column, and return { avatarUrl } as JSON. Reject unsupported MIME types with 422.",
    taskType: "feature",
  },
  {
    title: "Code review",
    scenario: "Token refresh PR",
    prompt:
      "Review the token-refresh implementation in src/auth/tokenRefresh.ts. Check for: silent rotation correctness, concurrent-refresh races (two tabs refreshing at once), clock-skew handling, secure storage of the refresh token on web vs. native, and any OWASP session-management violations. List issues by severity.",
    taskType: "review",
  },
  {
    title: "Design caching strategy",
    scenario: "High-traffic read path",
    prompt:
      "Design a caching strategy for the product catalog read path that serves 50 k req/s with a p99 < 20 ms. Current stack: Node.js + Postgres. Trade off Redis vs. in-process LRU vs. CDN edge caching. Address cache invalidation on price updates (which happen ~200×/day). Produce an architecture diagram in Mermaid and a migration plan.",
    taskType: "architecture",
  },
];

export function Hero() {
  const [activeTab, setActiveTab] = useState<(typeof INSTALL_TABS)[number]["id"]>("npm");
  const [copied, setCopied] = useState(false);
  const { setPrompt, setTaskType, setSelectedModelOverride } = useApp();

  const currentCmd = INSTALL_TABS.find((t) => t.id === activeTab)!.cmd;

  function copyCmd() {
    navigator.clipboard.writeText(currentCmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function loadExample(ex: (typeof EXAMPLES)[number]) {
    setSelectedModelOverride(null);
    setTaskType(ex.taskType);
    setPrompt(ex.prompt);
    // scroll to the prompt input
    document.getElementById("prompt-input")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="border-b border-border-subtle bg-bg-subtle/30 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        {/* Headline */}
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/15 text-accent">
                <CtokIcon className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-text">
                ctok playground
              </h2>
            </div>
            <p className="mt-2 max-w-xl text-sm text-text-muted">
              Paste a prompt and context files. ctok estimates token usage, recommends a model and effort level,
              and flags what to trim - before you send anything to Claude.
            </p>
          </div>

          {/* CLI install banner */}
          <div className="w-full shrink-0 rounded-lg border border-border bg-bg p-4 md:w-auto md:min-w-80">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-text-muted">
              <Terminal className="h-3.5 w-3.5" />
              Install the CLI
            </div>
            <div className="mb-2 flex gap-1 rounded-md border border-border-subtle bg-bg-subtle p-0.5">
              {INSTALL_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 rounded px-3 py-1 text-xs font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-accent text-white"
                      : "text-text-muted hover:text-text",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded bg-bg-subtle px-3 py-2 font-mono text-xs text-text">
                {currentCmd}
              </code>
              <button
                onClick={copyCmd}
                className="shrink-0 rounded border border-border px-3 py-2 text-xs text-text-muted transition-colors hover:border-accent hover:text-accent"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* Example scenarios */}
        <div className="mt-8">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-text-dim">
            Try an example
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.title}
                onClick={() => loadExample(ex)}
                className="group flex flex-col items-start rounded-lg border border-border bg-bg-subtle p-3 text-left transition-all hover:border-accent hover:bg-accent/5"
              >
                <span className="text-xs font-semibold text-text group-hover:text-accent">
                  {ex.title}
                </span>
                <span className="mt-0.5 text-[11px] text-text-dim">{ex.scenario}</span>
                <span className="mt-1.5 rounded border border-border-subtle px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
                  {ex.taskType}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
