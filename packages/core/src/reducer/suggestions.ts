import type { EstimatorInput, ReductionSuggestion, TokenEstimate } from "../types";
import { uid } from "../utils";

const LONG_FILE_TOKENS = 6_000;
const HUGE_FILE_TOKENS = 20_000;
const LONG_PROMPT_CHARS = 4_000;

export function buildSuggestions(
  input: EstimatorInput,
  estimate: TokenEstimate,
): ReductionSuggestion[] {
  const out: ReductionSuggestion[] = [];

  // 1. Oversized files
  for (const chunk of estimate.chunks) {
    if (["prompt", "pasted code", "project context"].includes(chunk.label)) continue;
    if (chunk.tokens >= HUGE_FILE_TOKENS) {
      out.push({
        id: uid("sug"),
        title: `Huge file: ${chunk.label}`,
        detail: `~${chunk.tokens.toLocaleString()} tokens. Claude probably doesn't need the whole thing. Provide only the relevant function(s), or a summary of unrelated sections.`,
        estimatedSavingTokens: Math.floor(chunk.tokens * 0.7),
        severity: "danger",
        action: "Trim or summarize",
        target: chunk.label,
      });
    } else if (chunk.tokens >= LONG_FILE_TOKENS) {
      out.push({
        id: uid("sug"),
        title: `Long file: ${chunk.label}`,
        detail: `~${chunk.tokens.toLocaleString()} tokens. Consider scoping to the relevant range (e.g. lines 200-400) if the task is local.`,
        estimatedSavingTokens: Math.floor(chunk.tokens * 0.4),
        severity: "warn",
        action: "Scope to relevant range",
        target: chunk.label,
      });
    }
  }

  // 2. Log content
  const logChunks = estimate.chunks.filter((c) => c.kind === "log");
  if (logChunks.length > 0) {
    const totalLog = logChunks.reduce((a, c) => a + c.tokens, 0);
    out.push({
      id: uid("sug"),
      title: "Log files detected",
      detail: `Logs (~${totalLog.toLocaleString()} tokens) are usually mostly noise. Paste the failing stack frame plus surrounding context (~30 lines) instead of the entire log.`,
      estimatedSavingTokens: Math.floor(totalLog * 0.85),
      severity: "warn",
      action: "Replace with stack frame excerpt",
    });
  }

  // 3. Minified content
  const minifiedChunks = estimate.chunks.filter((c) => c.kind === "minified");
  if (minifiedChunks.length > 0) {
    const total = minifiedChunks.reduce((a, c) => a + c.tokens, 0);
    out.push({
      id: uid("sug"),
      title: "Minified content detected",
      detail: `Minified files (~${total.toLocaleString()} tokens) burn tokens fast and don't help Claude understand. Provide source/unminified versions or remove.`,
      estimatedSavingTokens: Math.floor(total * 0.9),
      severity: "danger",
      action: "Remove or replace with source",
    });
  }

  // 4. Large diffs
  const diffChunks = estimate.chunks.filter(
    (c) => c.kind === "diff" && c.tokens > 3000,
  );
  for (const c of diffChunks) {
    out.push({
      id: uid("sug"),
      title: `Large diff in ${c.label}`,
      detail: `Diff is ~${c.tokens.toLocaleString()} tokens. For review, only the changed hunks + 5-10 lines of context are usually needed.`,
      estimatedSavingTokens: Math.floor(c.tokens * 0.5),
      severity: "warn",
      action: "Tighten diff context",
      target: c.label,
    });
  }

  // 5. Duplicated content across files
  const dupes = detectDuplicates(input);
  if (dupes.length > 0) {
    out.push({
      id: uid("sug"),
      title: "Likely duplicate context",
      detail: `Detected near-identical content in: ${dupes.join(", ")}. Provide it once and reference it from the prompt.`,
      estimatedSavingTokens: 1500,
      severity: "info",
      action: "Deduplicate",
    });
  }

  // 6. Filler-heavy long prompt
  if (input.prompt.length > LONG_PROMPT_CHARS) {
    const filler = countFillerPhrases(input.prompt);
    if (filler >= 3) {
      out.push({
        id: uid("sug"),
        title: "Prompt has filler / restated context",
        detail: `Prompt is ${input.prompt.length.toLocaleString()} chars and contains repetitive phrasing. Replace boilerplate with a one-line task statement plus concrete acceptance criteria.`,
        estimatedSavingTokens: Math.floor((input.prompt.length / 4) * 0.4),
        severity: "info",
        action: "Tighten prompt",
        target: "prompt",
      });
    }
  }

  // 7. Many files
  if (input.files.length >= 8) {
    out.push({
      id: uid("sug"),
      title: `${input.files.length} files attached`,
      detail:
        "At this breadth, Claude works better from a short index (path + 1-line purpose) plus full content for only the 2-3 files actually being changed.",
      estimatedSavingTokens: Math.floor(estimate.input.expected * 0.35),
      severity: "warn",
      action: "Switch to file index + targeted contents",
    });
  }

  // 8. Heavy project context block
  const ctxChunk = estimate.chunks.find((c) => c.label === "project context");
  if (ctxChunk && ctxChunk.tokens > 8_000) {
    out.push({
      id: uid("sug"),
      title: "Heavy project context block",
      detail: `Project context is ~${ctxChunk.tokens.toLocaleString()} tokens. Move stable conventions into a CLAUDE.md and reference it instead of re-pasting every turn.`,
      estimatedSavingTokens: Math.floor(ctxChunk.tokens * 0.7),
      severity: "warn",
      action: "Externalize to CLAUDE.md",
      target: "project context",
    });
  }

  // 9. Approaching context window
  if (estimate.input.expected > 180_000) {
    out.push({
      id: uid("sug"),
      title: "Approaching context limits",
      detail: `Input is ${estimate.input.expected.toLocaleString()} tokens - close to the 200k window. You'll lose room for Claude's reasoning. Split the task or move bulk context to retrieval/summary.`,
      estimatedSavingTokens: estimate.input.expected - 80_000,
      severity: "danger",
      action: "Split task or summarize",
    });
  }

  const sev: Record<ReductionSuggestion["severity"], number> = {
    danger: 0,
    warn: 1,
    info: 2,
  };
  out.sort(
    (a, b) =>
      sev[a.severity] - sev[b.severity] ||
      b.estimatedSavingTokens - a.estimatedSavingTokens,
  );
  return out;
}

function detectDuplicates(input: EstimatorInput): string[] {
  const labelByPrefix = new Map<string, string>();
  const dupes = new Set<string>();
  for (const f of input.files) {
    if (f.content.length < 200) continue;
    const fingerprint = f.content.replace(/\s+/g, " ").trim().slice(0, 160);
    const seen = labelByPrefix.get(fingerprint);
    if (seen) {
      dupes.add(seen);
      dupes.add(f.name);
    } else {
      labelByPrefix.set(fingerprint, f.name);
    }
  }
  return [...dupes];
}

function countFillerPhrases(text: string): number {
  const phrases = [
    /\bplease\b/gi,
    /\bas mentioned\b/gi,
    /\bfor your reference\b/gi,
    /\bbe sure to\b/gi,
    /\bmake sure to\b/gi,
    /\bdo not forget\b/gi,
    /\bremember that\b/gi,
    /\bkeep in mind\b/gi,
    /\b(very|really|extremely|incredibly)\b/gi,
  ];
  let n = 0;
  for (const p of phrases) {
    const m = text.match(p);
    if (m) n += m.length;
  }
  return n;
}
