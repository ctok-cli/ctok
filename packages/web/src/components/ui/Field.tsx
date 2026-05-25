import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {label}
        </span>
        {hint && <span className="text-[11px] text-text-dim">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
