"use client";

import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";

export function PromptInput() {
  const { prompt, pastedCode, projectContext, setPrompt, setPastedCode, setProjectContext } = useApp();

  return (
    <Card
      title="Prompt & context"
      subtitle="Paste exactly what you'd send to Claude Code. Everything here counts toward input tokens."
    >
      <div className="space-y-4">
        <Field
          label="Prompt"
          hint={`${prompt.length.toLocaleString()} chars`}
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Refactor the auth middleware to use the new session store. Keep existing public API."
            rows={5}
            className="w-full resize-y rounded-md border border-border bg-bg-subtle p-3 font-mono text-sm leading-relaxed text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
          />
        </Field>

        <Field
          label="Pasted code (optional)"
          hint={`${pastedCode.length.toLocaleString()} chars`}
        >
          <textarea
            value={pastedCode}
            onChange={(e) => setPastedCode(e.target.value)}
            placeholder="Paste a function, error, or snippet you want Claude to look at."
            rows={4}
            className="w-full resize-y rounded-md border border-border bg-bg-subtle p-3 font-mono text-xs leading-relaxed text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
          />
        </Field>

        <Field
          label={
            <span className="inline-flex items-center gap-2">
              Project context (optional)
              <Badge tone="accent" className="normal-case">CLAUDE.md style</Badge>
            </span>
          }
          hint={`${projectContext.length.toLocaleString()} chars`}
        >
          <textarea
            value={projectContext}
            onChange={(e) => setProjectContext(e.target.value)}
            placeholder="Stable rules / conventions / file map. Counted once per task — consider moving this to CLAUDE.md."
            rows={3}
            className="w-full resize-y rounded-md border border-border bg-bg-subtle p-3 font-mono text-xs leading-relaxed text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
          />
        </Field>
      </div>
    </Card>
  );
}
