import type { ChunkAnalysis, ContentKind } from "../types";
import { CHARS_PER_TOKEN, RATIO_VARIANCE, classify } from "./contentTypes";

// Adjust token count for symbol density (each non-alphanumeric symbol tends to
// be its own token in BPE), but cap the bonus to avoid double-counting.
function symbolAdjustment(text: string): number {
  if (!text) return 0;
  let symbols = 0;
  let whitespaceRuns = 0;
  let inWs = false;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    const isLetter = (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
    const isDigit = c >= 48 && c <= 57;
    const isSpace = c === 32 || c === 9 || c === 10 || c === 13;
    if (!isLetter && !isDigit && !isSpace && c < 128) symbols++;
    if (isSpace) {
      if (!inWs) {
        whitespaceRuns++;
        inWs = true;
      }
    } else {
      inWs = false;
    }
  }
  const wsBonus = Math.min(whitespaceRuns * 0.4, text.length * 0.05);
  return Math.min(symbols * 0.25 + wsBonus, text.length * 0.2);
}

export function estimateTokensFor(
  text: string,
  hintExt?: string,
  label = "chunk",
): ChunkAnalysis {
  const kind: ContentKind = classify(text, hintExt);
  const ratio = CHARS_PER_TOKEN[kind];
  const base = text.length / ratio;
  const adj = symbolAdjustment(text);
  const tokens = Math.ceil(base + adj * 0.5);
  return { label, kind, chars: text.length, tokens, ratio };
}

export function rangeForChunk(c: ChunkAnalysis) {
  const variance = RATIO_VARIANCE[c.kind] ?? 0.12;
  return {
    min: Math.floor(c.tokens * (1 - variance)),
    max: Math.ceil(c.tokens * (1 + variance)),
  };
}
