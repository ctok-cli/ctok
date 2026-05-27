import type { PassResult, PassSuggestion } from "../types";

const CHARS_PER_TOKEN = 4;
const CODE_BLOCK_TOKEN_THRESHOLD = 300; // ~1200 chars

/** Match fenced code blocks. Captures optional language hint and body. */
const CODE_FENCE_RE = /```(?:[a-z\w]*)\n([\s\S]*?)```/g;

/** Heuristic: try to infer a plausible file path from the code content.
 *  Looks for import/package/class declarations or filename hints in the prompt text
 *  immediately before the code block.
 */
function inferFilePath(code: string, precedingText: string): string | null {
  // TypeScript / JavaScript: look for "in src/..." or "file: src/..." in preceding text
  const fileHintRe = /(?:in|from|file|path)[\s:]+([^\s,'"]+\.[a-z]{1,5})/i;
  const hintMatch = precedingText.match(fileHintRe);
  if (hintMatch) return hintMatch[1];

  // Try to infer from package declaration (Java/Kotlin)
  const pkgMatch = code.match(/^package\s+([\w.]+)/m);
  if (pkgMatch) {
    const parts = pkgMatch[1].split(".");
    const last = parts[parts.length - 1];
    return `src/${parts.join("/")}.kt`;
  }

  // Python module: look for "# file: X" comment
  const pyFileMatch = code.match(/^#\s*(?:file|module):\s*([^\n]+)/im);
  if (pyFileMatch) return pyFileMatch[1].trim();

  // Dart: look for class name
  const dartClassMatch = code.match(/^class\s+(\w+)/m);
  if (dartClassMatch) return `lib/${dartClassMatch[1].toLowerCase()}.dart`;

  // TypeScript/JS: look for export default / export class / export function
  const tsExportMatch = code.match(/^export\s+(?:default\s+)?(?:class|function|const)\s+(\w+)/m);
  if (tsExportMatch) return `src/${tsExportMatch[1]}.ts`;

  // Rust: look for mod name
  const rustFnMatch = code.match(/^(?:pub\s+)?fn\s+(\w+)/m);
  if (rustFnMatch) return `src/${rustFnMatch[1]}.rs`;

  return null;
}

function countCodeLines(code: string): [number, number] {
  const lines = code.split("\n");
  return [1, lines.length];
}

export function fileRefCompression(prompt: string): PassResult {
  const suggestions: PassSuggestion[] = [];

  let match: RegExpExecArray | null;
  CODE_FENCE_RE.lastIndex = 0;

  while ((match = CODE_FENCE_RE.exec(prompt)) !== null) {
    const fullBlock = match[0];
    const codeBody = match[1];
    const tokenCount = Math.round(codeBody.length / CHARS_PER_TOKEN);

    if (tokenCount < CODE_BLOCK_TOKEN_THRESHOLD) continue;

    const precedingText = prompt.slice(Math.max(0, match.index - 300), match.index);
    const filePath = inferFilePath(codeBody, precedingText);
    const [startLine, endLine] = countCodeLines(codeBody);

    const reference = filePath
      ? `see \`${filePath}:${startLine}-${endLine}\``
      : `[paste only the relevant lines, or reference the file path]`;

    const tokenDelta = -(tokenCount - 10); // keep ~10 tokens for the reference

    suggestions.push({
      label: `Replace large code block (~${tokenCount} tokens) with file reference`,
      original: fullBlock,
      replacement: reference,
      reason:
        `This code block is ~${tokenCount} tokens. ` +
        (filePath
          ? `Claude Code can read \`${filePath}\` directly - replace the paste with a reference to save these tokens.`
          : `If you're using Claude Code (or any tool with file access), replace the pasted code with a file path + line range.`),
      tokenDelta,
    });
  }

  const tokenDelta = suggestions.reduce((s, sg) => s + sg.tokenDelta, 0);

  return {
    pass: "fileRefCompression",
    name: "File-reference compression",
    applied: suggestions.length > 0,
    suggestions,
    tokenDelta,
  };
}

export function applyFileRefCompression(prompt: string): string {
  const result = fileRefCompression(prompt);
  if (!result.applied) return prompt;
  let working = prompt;
  for (const sg of result.suggestions) {
    working = working.replace(sg.original, sg.replacement);
  }
  return working;
}
