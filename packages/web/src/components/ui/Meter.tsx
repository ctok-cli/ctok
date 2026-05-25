import { cn } from "@/lib/utils";

export function Meter({
  value,
  max,
  zones = [],
  label,
  className,
}: {
  value: number;
  max: number;
  zones?: { from: number; to: number; tone: "ok" | "warn" | "danger" }[];
  label?: string;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  let tone: "ok" | "warn" | "danger" = "ok";
  for (const z of zones) {
    if (value >= z.from && value <= z.to) tone = z.tone;
  }
  const toneClass =
    tone === "ok"
      ? "bg-ok"
      : tone === "warn"
        ? "bg-warn"
        : "bg-danger";
  return (
    <div className={cn("space-y-1", className)}>
      {label && <div className="flex justify-between text-xs text-text-muted">
        <span>{label}</span>
        <span className="font-mono">{Math.round(pct)}%</span>
      </div>}
      <div className="h-2 w-full overflow-hidden rounded-full bg-bg-subtle">
        <div
          className={cn("h-full rounded-full transition-all", toneClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
