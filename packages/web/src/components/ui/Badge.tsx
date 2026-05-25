import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "ok" | "warn" | "danger" | "accent";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-bg-subtle text-text-muted border-border",
    ok: "bg-ok/10 text-ok border-ok/20",
    warn: "bg-warn/10 text-warn border-warn/30",
    danger: "bg-danger/10 text-danger border-danger/30",
    accent: "bg-accent/15 text-accent border-accent/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
