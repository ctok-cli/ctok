import { h, Fragment, render } from "preact";
import { useState, useCallback, useRef } from "preact/hooks";
import { analyze } from "@ctok/core";
import { refine } from "@ctok/refiner";
import type { AnalysisResult } from "@ctok/core";
import type { RefineResult } from "@ctok/refiner";

// styles

const STYLES = `
  :host { all: initial; }
  * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

  #ctok-root {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 2147483647;
    width: 280px;
    background: #0f1117;
    border: 1px solid #2a2d3a;
    border-radius: 10px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5);
    overflow: hidden;
    transition: width 0.2s ease;
  }
  #ctok-root.expanded { width: 340px; }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    background: #161920;
    border-bottom: 1px solid #2a2d3a;
    cursor: default;
    user-select: none;
  }
  .header-left { display: flex; align-items: center; gap: 6px; }
  .logo { font-size: 11px; font-weight: 700; color: #c97a3a; letter-spacing: 0.5px; }
  .site-badge {
    font-size: 10px; color: #888; background: #1e2230;
    padding: 1px 6px; border-radius: 10px;
  }
  .dismiss {
    font-size: 14px; color: #666; cursor: pointer; line-height: 1;
    background: none; border: none; padding: 0 2px;
  }
  .dismiss:hover { color: #aaa; }

  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1px;
    background: #2a2d3a;
  }
  .stat {
    background: #0f1117;
    padding: 8px 8px 6px;
    text-align: center;
  }
  .stat-val { font-size: 17px; font-weight: 600; color: #e6e8ee; font-variant-numeric: tabular-nums; }
  .stat-val.warn { color: #e2a03a; }
  .stat-val.danger { color: #e05252; }
  .stat-label { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px; }

  .rec {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    border-bottom: 1px solid #1e2230;
  }
  .model-badge {
    font-size: 10px; font-weight: 600; padding: 2px 7px;
    border-radius: 10px; background: #c97a3a22; color: #c97a3a;
    border: 1px solid #c97a3a44;
  }
  .model-badge.haiku { background: #22883322; color: #44cc77; border-color: #44cc7744; }
  .model-badge.sonnet { background: #c97a3a22; color: #c97a3a; border-color: #c97a3a44; }
  .model-badge.opus { background: #8844ee22; color: #aa66ff; border-color: #aa66ff44; }
  .effort-badge {
    font-size: 10px; color: #777; padding: 2px 7px;
    border-radius: 10px; border: 1px solid #2a2d3a;
  }

  .actions { padding: 6px 10px; display: flex; gap: 6px; }
  .btn-refine {
    flex: 1; padding: 5px 0; font-size: 11px; font-weight: 600;
    background: #c97a3a22; color: #c97a3a; border: 1px solid #c97a3a55;
    border-radius: 6px; cursor: pointer; transition: background 0.15s;
  }
  .btn-refine:hover { background: #c97a3a44; }
  .btn-refine:disabled { opacity: 0.4; cursor: default; }

  .refine-panel {
    border-top: 1px solid #2a2d3a;
    padding: 8px 10px;
    max-height: 260px;
    overflow-y: auto;
  }
  .refine-panel::-webkit-scrollbar { width: 4px; }
  .refine-panel::-webkit-scrollbar-thumb { background: #2a2d3a; border-radius: 2px; }

  .refine-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 8px;
  }
  .refine-title { font-size: 11px; font-weight: 600; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; }
  .score-bar { font-size: 11px; color: #888; }
  .score-val { font-weight: 700; color: #c97a3a; }

  .refined-text {
    font-size: 11px; color: #ccc; background: #161920;
    border: 1px solid #2a2d3a; border-radius: 6px;
    padding: 8px; line-height: 1.5; white-space: pre-wrap;
    max-height: 120px; overflow-y: auto; margin-bottom: 6px;
  }
  .refined-text::-webkit-scrollbar { width: 4px; }
  .refined-text::-webkit-scrollbar-thumb { background: #2a2d3a; }

  .pass-list { margin-bottom: 6px; }
  .pass-item {
    display: flex; align-items: center; gap: 6px;
    padding: 3px 0; font-size: 10px; color: #888;
    border-bottom: 1px solid #1a1d24;
  }
  .pass-item:last-child { border-bottom: none; }
  .pass-dot { width: 6px; height: 6px; border-radius: 50%; background: #2a2d3a; flex-shrink: 0; }
  .pass-dot.applied { background: #44cc77; }
  .pass-name { color: #aaa; flex: 1; }
  .pass-delta { color: #44cc77; font-variant-numeric: tabular-nums; }
  .pass-delta.zero { color: #555; }

  .copy-btn {
    width: 100%; padding: 5px 0; font-size: 10px; font-weight: 600;
    background: #1e2230; color: #aaa; border: 1px solid #2a2d3a;
    border-radius: 6px; cursor: pointer; transition: background 0.15s;
  }
  .copy-btn:hover { background: #252a38; color: #ccc; }

  .empty { padding: 12px 10px; font-size: 11px; color: #555; text-align: center; }
  .spinner {
    display: inline-block; width: 12px; height: 12px;
    border: 2px solid #333; border-top-color: #c97a3a;
    border-radius: 50%; animation: spin 0.6s linear infinite;
    vertical-align: middle; margin-right: 4px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// helpers

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function fmtUsd(n: number): string {
  if (n < 0.001) return "< $0.001";
  if (n < 0.01) return "$" + n.toFixed(4);
  if (n < 1) return "$" + n.toFixed(3);
  return "$" + n.toFixed(2);
}

function tokenTone(tokens: number): string {
  if (tokens > 150_000) return "danger";
  if (tokens > 80_000) return "warn";
  return "";
}

function modelClass(model: string): string {
  if (model.includes("haiku")) return "haiku";
  if (model.includes("opus")) return "opus";
  return "sonnet";
}

// component

interface WidgetProps {
  text: string;
  siteLabel: string;
  onDismiss: () => void;
}

function Widget({ text, siteLabel, onDismiss }: WidgetProps) {
  const [refineResult, setRefineResult] = useState<RefineResult | null>(null);
  const [refining, setRefining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRefine, setShowRefine] = useState(false);

  const trimmed = text.trim();

  if (!trimmed) {
    return (
      <div id="ctok-root">
        <div class="header">
          <div class="header-left">
            <span class="logo">ctok</span>
            <span class="site-badge">{siteLabel}</span>
          </div>
          <button class="dismiss" onClick={onDismiss} title="Dismiss">×</button>
        </div>
        <div class="empty">Start typing to see token estimates</div>
      </div>
    );
  }

  const result: AnalysisResult = analyze({ prompt: trimmed, files: [], taskType: "general" });
  const { estimate, recommendation, cost } = result;

  async function handleRefine() {
    if (refining) return;
    setRefining(true);
    setShowRefine(true);
    try {
      const r = refine({ prompt: trimmed });
      setRefineResult(r);
    } finally {
      setRefining(false);
    }
  }

  function copyRefined() {
    if (!refineResult) return;
    navigator.clipboard.writeText(refineResult.refined).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <div id="ctok-root" class={showRefine ? "expanded" : ""}>
      <div class="header">
        <div class="header-left">
          <span class="logo">ctok</span>
          <span class="site-badge">{siteLabel}</span>
        </div>
        <button class="dismiss" onClick={onDismiss} title="Dismiss">×</button>
      </div>

      <div class="stats">
        <div class="stat">
          <div class={`stat-val ${tokenTone(estimate.input.expected)}`}>
            {fmtTokens(estimate.input.expected)}
          </div>
          <div class="stat-label">Input</div>
        </div>
        <div class="stat">
          <div class="stat-val">{fmtTokens(estimate.output.expected)}</div>
          <div class="stat-label">Est. output</div>
        </div>
        <div class="stat">
          <div class="stat-val">{fmtUsd(cost.totalUsd)}</div>
          <div class="stat-label">~Cost</div>
        </div>
      </div>

      <div class="rec">
        <span class={`model-badge ${modelClass(recommendation.model.model)}`}>
          {recommendation.model.model.split("-")[0]}
        </span>
        <span class="effort-badge">{recommendation.effort.effort} effort</span>
      </div>

      <div class="actions">
        <button
          class="btn-refine"
          onClick={handleRefine}
          disabled={refining}
        >
          {refining
            ? <><span class="spinner" /> Refining…</>
            : showRefine
              ? "↻ Re-refine"
              : "✦ Refine prompt"}
        </button>
      </div>

      {showRefine && (
        <div class="refine-panel">
          {refining && !refineResult ? (
            <div class="empty"><span class="spinner" /> Running passes…</div>
          ) : refineResult ? (
            <>
              <div class="refine-header">
                <span class="refine-title">Refined</span>
                <span class="score-bar">
                  score <span class="score-val">{refineResult.specificityScore}</span>/100
                  {refineResult.savedTokens > 0 && (
                    <span style="color:#44cc77; margin-left:6px">
                      −{refineResult.savedTokens} tok
                    </span>
                  )}
                </span>
              </div>

              <div class="refined-text">{refineResult.refined}</div>

              <div class="pass-list">
                {refineResult.passes.map((p) => (
                  <div class="pass-item" key={p.pass}>
                    <div class={`pass-dot ${p.applied ? "applied" : ""}`} />
                    <span class="pass-name">{p.name}</span>
                    {p.tokenDelta !== 0 && (
                      <span class={`pass-delta ${p.tokenDelta === 0 ? "zero" : ""}`}>
                        {p.tokenDelta < 0 ? p.tokenDelta : `+${p.tokenDelta}`}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <button class="copy-btn" onClick={copyRefined}>
                {copied ? "✓ Copied!" : "Copy refined prompt"}
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

// mount

export function mountWidget(
  shadow: ShadowRoot,
  getText: () => string,
  siteLabel: string,
  onDismiss: () => void,
) {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(STYLES);
  shadow.adoptedStyleSheets = [sheet];

  function doRender() {
    render(
      <Widget text={getText()} siteLabel={siteLabel} onDismiss={onDismiss} />,
      shadow,
    );
  }

  return doRender;
}
