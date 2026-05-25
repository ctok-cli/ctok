/**
 * Fast approximate token count using the ~4 chars/token heuristic.
 * The real tokenizer isn't available client-side, but this is close enough
 * for before/after comparison where both sides use the same estimator.
 */
export function approxTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
