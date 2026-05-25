import * as vscode from "vscode";
import { runAnalysis, fmtTokens } from "./analysis";
import { debounce } from "./debounce";
import { getConfig } from "./config";

let statusBarItem: vscode.StatusBarItem | undefined;

export function createStatusBar(context: vscode.ExtensionContext): void {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.command = "ctok.showPanel";
  statusBarItem.tooltip = "ctok — Click to open analysis panel";
  context.subscriptions.push(statusBarItem);

  const update = debounce(updateStatusBar, 500);

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => update()),
    vscode.workspace.onDidChangeTextDocument(() => {
      if (getConfig().autoAnalyze) update();
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("ctok")) update();
    }),
  );

  update();
}

export function updateStatusBar(): void {
  const cfg = getConfig();

  if (!cfg.showStatusBar || !statusBarItem) {
    statusBarItem?.hide();
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    statusBarItem.hide();
    return;
  }

  const text = editor.document.getText();
  if (!text.trim()) {
    statusBarItem.hide();
    return;
  }

  try {
    const { result, quotaPct } = runAnalysis(text, {
      model: cfg.model || undefined,
      taskType: cfg.taskType,
      plan: cfg.plan,
    });

    const tokens = fmtTokens(result.estimate.input.expected);
    const quota = quotaPct != null ? ` · ${(quotaPct * 100).toFixed(1)}% quota` : "";
    statusBarItem.text = `$(pulse) ${tokens} tok${quota}`;
    statusBarItem.backgroundColor = undefined;
    statusBarItem.show();
  } catch {
    statusBarItem.text = "$(pulse) ctok";
    statusBarItem.show();
  }
}

export function disposeStatusBar(): void {
  statusBarItem?.dispose();
  statusBarItem = undefined;
}
