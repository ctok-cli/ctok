// Pure utility functions - no React, no CSS, no browser APIs.
// The `cn` class-merge helper lives in @ctok/web only.

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "-";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + "k";
  return Math.round(n).toString();
}

export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return "-";
  if (n < 0.01) return "<$0.01";
  if (n < 1) return "$" + n.toFixed(3);
  if (n < 100) return "$" + n.toFixed(2);
  return "$" + n.toFixed(0);
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function truncate(s: string, n = 120): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}
