import * as vscode from "vscode";
import type { CtokAnalysis } from "./analysis";
import { fmtTokens, fmtUsd, fmtPct } from "./analysis";

let panel: vscode.WebviewPanel | undefined;

export function showAnalysisPanel(
  context: vscode.ExtensionContext,
  analysis: CtokAnalysis,
  title: string,
): void {
  if (panel) {
    panel.reveal(vscode.ViewColumn.Beside);
  } else {
    panel = vscode.window.createWebviewPanel(
      "ctokAnalysis",
      "ctok Analysis",
      vscode.ViewColumn.Beside,
      { enableScripts: false, retainContextWhenHidden: true },
    );
    panel.onDidDispose(() => { panel = undefined; }, null, context.subscriptions);
  }

  panel.title = `ctok: ${title}`;
  panel.webview.html = buildHtml(analysis, title);
}

function buildHtml(analysis: CtokAnalysis, title: string): string {
  const { result, refineResult, quotaPct, remainingMessages, scanResult } = analysis;
  const { estimate, cost, recommendation, suggestions } = result;

  const rows = (pairs: [string, string][]) =>
    pairs.map(([k, v]) => `<tr><td class="key">${esc(k)}</td><td>${esc(v)}</td></tr>`).join("\n");

  const suggestionRows = suggestions.length === 0
    ? `<p class="none">No suggestions - prompt looks good.</p>`
    : suggestions.map((s) => `
        <div class="suggestion ${s.severity}">
          <strong>${esc(s.title)}</strong>
          <span class="detail">${esc(s.detail)}</span>
          <span class="saving">Save ~${fmtTokens(s.estimatedSavingTokens)} tokens</span>
        </div>`).join("\n");

  const refinerSection = refineResult ? `
    <h2>Refiner</h2>
    <table>
      ${rows([
        ["Specificity score", `${refineResult.specificityScore} / 100`],
        ["Tokens saved", refineResult.savedTokens > 0 ? `~${fmtTokens(refineResult.savedTokens)} (${refineResult.savedPct}%)` : "< 1%"],
        ["Passes applied", refineResult.passes.filter((p) => p.applied).map((p) => p.pass).join(", ") || "none"],
      ])}
    </table>
    <h3>Refined prompt</h3>
    <pre class="refined">${esc(refineResult.refined)}</pre>
  ` : "";

  const quotaSection = quotaPct != null ? `
    <h2>Quota impact</h2>
    <table>
      ${rows([
        ["5h window used", fmtPct(quotaPct)],
        ["Remaining messages", remainingMessages != null ? `~${remainingMessages}` : "-"],
      ])}
    </table>
    <p class="note">Estimated - exact quota not exposed by Anthropic API.</p>
  ` : "";

  const scanSection = scanResult ? (() => {
    const extRows = Object.entries(scanResult.byExtension)
      .sort((a, b) => b[1].tokens - a[1].tokens)
      .slice(0, 8)
      .map(([ext, s]) => `<tr><td>.${esc(ext)}</td><td>${s.files}</td><td>${fmtTokens(s.tokens)}</td></tr>`)
      .join("\n");

    const heavyRows = scanResult.topHeavyFiles
      .map((f) => `<tr><td class="path">${esc(f.path)}</td><td>${fmtTokens(f.tokens)}</td></tr>`)
      .join("\n");

    const excludedReasons = Object.entries(scanResult.excluded.reasons)
      .map(([r, n]) => `${n} ${r}`)
      .join(", ");

    return `
    <h2>Project scan</h2>
    <table>
      ${rows([
        ["Project type", scanResult.projectType],
        ["Files scanned", String(scanResult.totalFiles)],
        ["Files excluded", `${scanResult.excluded.files} (${excludedReasons || "none"})`],
        ["Estimated tokens", fmtTokens(scanResult.estimatedTokens)],
        ["Context window", fmtPct(scanResult.estimatedTokens / 200_000) + " of 200k"],
      ])}
    </table>
    ${extRows ? `
    <h3>By extension</h3>
    <table>
      <tr><th class="key">Ext</th><th>Files</th><th>Tokens</th></tr>
      ${extRows}
    </table>` : ""}
    ${heavyRows ? `
    <h3>Heaviest files</h3>
    <table>
      <tr><th class="key">File</th><th>Tokens</th></tr>
      ${heavyRows}
    </table>` : ""}
  `;
  })() : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
  <title>ctok Analysis</title>
  <style>
    body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 16px 24px; line-height: 1.5; }
    h1 { font-size: 1.1em; font-weight: 600; color: var(--vscode-textLink-foreground); margin: 0 0 16px; }
    h2 { font-size: 0.95em; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vscode-descriptionForeground); margin: 20px 0 8px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 4px; }
    h3 { font-size: 0.9em; font-weight: 600; margin: 12px 0 4px; }
    table { border-collapse: collapse; width: 100%; }
    td { padding: 4px 8px 4px 0; vertical-align: top; font-size: 0.9em; }
    td.key { color: var(--vscode-descriptionForeground); width: 40%; white-space: nowrap; }
    .suggestion { padding: 8px 10px; margin: 6px 0; border-radius: 4px; font-size: 0.88em; }
    .suggestion.warn { background: color-mix(in srgb, var(--vscode-editorWarning-foreground) 12%, transparent); border-left: 3px solid var(--vscode-editorWarning-foreground); }
    .suggestion.info { background: color-mix(in srgb, var(--vscode-editorInfo-foreground) 12%, transparent); border-left: 3px solid var(--vscode-editorInfo-foreground); }
    .suggestion strong { display: block; margin-bottom: 2px; }
    .suggestion .detail { display: block; color: var(--vscode-descriptionForeground); }
    .suggestion .saving { display: block; font-size: 0.85em; color: var(--vscode-charts-green); margin-top: 2px; }
    pre.refined { background: var(--vscode-textCodeBlock-background); padding: 10px; border-radius: 4px; white-space: pre-wrap; word-break: break-word; font-family: var(--vscode-editor-font-family); font-size: 0.88em; max-height: 300px; overflow-y: auto; }
    .none { color: var(--vscode-descriptionForeground); font-style: italic; font-size: 0.9em; }
    .note { color: var(--vscode-descriptionForeground); font-size: 0.8em; font-style: italic; }
    .badge { display: inline-block; padding: 1px 7px; border-radius: 10px; font-size: 0.8em; font-weight: 600; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
  </style>
</head>
<body>
  <h1>⚡ ${esc(title)}</h1>

  ${scanSection}

  ${scanResult ? "" : `
  <h2>Token estimate</h2>
  <table>
    ${rows([
      ["Input tokens", `${fmtTokens(estimate.input.expected)} (range ${fmtTokens(estimate.input.min)}-${fmtTokens(estimate.input.max)})`],
      ["Output tokens", `${fmtTokens(estimate.output.expected)} (range ${fmtTokens(estimate.output.min)}-${fmtTokens(estimate.output.max)})`],
      ["Context window", `${fmtPct(estimate.input.expected / 200_000)} of 200k`],
      ["Confidence", estimate.confidence],
    ])}
  </table>

  <h2>Cost</h2>
  <table>
    ${rows([
      ["Model", cost.model],
      ["Input cost", fmtUsd(cost.inputUsd)],
      ["Output cost", fmtUsd(cost.outputUsd)],
      ["Total (expected)", fmtUsd(cost.totalUsd)],
      ["Total (range)", `${fmtUsd(cost.totalUsdRange.min)} - ${fmtUsd(cost.totalUsdRange.max)}`],
    ])}
  </table>

  <h2>Recommendation</h2>
  <table>
    ${rows([
      ["Model", recommendation.model.model],
      ["Effort", recommendation.effort.effort],
      ["Why", recommendation.model.reason],
    ])}
  </table>

  <h2>Suggestions</h2>
  ${suggestionRows}
  `}

  ${refinerSection}
  ${quotaSection}
</body>
</html>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
