"use client";

interface HashState {
  p?: string;
  c?: string;
  x?: string;
  t?: string;
}

function b64encode(str: string): string {
  return btoa(encodeURIComponent(str))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64decode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return decodeURIComponent(atob(padded + pad));
}

export function readHashState(): HashState | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return null;
  try {
    const params = new URLSearchParams(raw);
    const val = params.get("s");
    if (!val) return null;
    return JSON.parse(b64decode(val)) as HashState;
  } catch {
    return null;
  }
}

export function writeHashState(state: HashState): void {
  if (typeof window === "undefined") return;
  const compact: HashState = {};
  if (state.p?.trim()) compact.p = state.p;
  if (state.c?.trim()) compact.c = state.c;
  if (state.x?.trim()) compact.x = state.x;
  if (state.t && state.t !== "general") compact.t = state.t;

  if (Object.keys(compact).length === 0) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
    return;
  }
  const encoded = b64encode(JSON.stringify(compact));
  const params = new URLSearchParams();
  params.set("s", encoded);
  history.replaceState(null, "", "#" + params.toString());
}
