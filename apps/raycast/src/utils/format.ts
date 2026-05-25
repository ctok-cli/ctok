export function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function fmtUsd(n: number): string {
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

export function fmtPct(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

export function effortEmoji(effort: string): string {
  switch (effort) {
    case "low": return "🟢";
    case "medium": return "🟡";
    case "high": return "🟠";
    case "xhigh": return "🔴";
    default: return "⚪";
  }
}

export function confidenceBadge(confidence: string): string {
  switch (confidence) {
    case "high": return "High ✓";
    case "medium": return "Medium ~";
    case "low": return "Low ?";
    default: return confidence;
  }
}
