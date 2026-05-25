import * as vscode from "vscode";
import { scan } from "@ctok/scanner";
import { runAnalysis, fmtTokens } from "./analysis";
import { showAnalysisPanel } from "./panel";
import { getConfig } from "./config";

export async function cmdCheck(context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage("ctok: No active editor.");
    return;
  }

  const text = editor.document.getText();
  if (!text.trim()) {
    vscode.window.showInformationMessage("ctok: File is empty.");
    return;
  }

  const cfg = getConfig();
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Window, title: "ctok: Analysing…" },
    async () => {
      const analysis = runAnalysis(text, {
        model: cfg.model || undefined,
        taskType: cfg.taskType,
        plan: cfg.plan,
      });
      const fileName = editor.document.fileName.split(/[\\/]/).pop() ?? "file";
      showAnalysisPanel(context, analysis, fileName);
    },
  );
}

export async function cmdCheckSelection(context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.selection.isEmpty) {
    vscode.window.showInformationMessage("ctok: No text selected.");
    return;
  }

  const text = editor.document.getText(editor.selection);
  const cfg = getConfig();

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Window, title: "ctok: Analysing selection…" },
    async () => {
      const analysis = runAnalysis(text, {
        model: cfg.model || undefined,
        taskType: cfg.taskType,
        plan: cfg.plan,
      });
      showAnalysisPanel(context, analysis, "Selection");
    },
  );
}

export async function cmdRefineSelection(context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.selection.isEmpty) {
    vscode.window.showInformationMessage("ctok: No text selected.");
    return;
  }

  const text = editor.document.getText(editor.selection);
  const cfg = getConfig();

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Window, title: "ctok: Refining…" },
    async () => {
      const analysis = runAnalysis(text, {
        model: cfg.model || undefined,
        taskType: cfg.taskType,
        plan: cfg.plan,
        withRefine: true,
      });

      if (!analysis.refineResult) return;

      const { refined, savedTokens, savedPct } = analysis.refineResult;

      if (refined === text.trim()) {
        vscode.window.showInformationMessage("ctok: Prompt is already well-formed. No changes needed.");
        return;
      }

      const savingsMsg = savedTokens > 0
        ? ` (saves ~${fmtTokens(savedTokens)} tokens, ${savedPct}%)`
        : "";

      const action = await vscode.window.showInformationMessage(
        `ctok: Refinement ready${savingsMsg}. Replace selection?`,
        "Replace",
        "Show diff",
        "Dismiss",
      );

      if (action === "Replace") {
        await editor.edit((eb) => {
          eb.replace(editor.selection, refined);
        });
        vscode.window.showInformationMessage(`ctok: Replaced selection.${savingsMsg}`);
      } else if (action === "Show diff") {
        showAnalysisPanel(context, analysis, "Refine Selection");
      }
    },
  );
}

export async function cmdScan(context: vscode.ExtensionContext): Promise<void> {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode.window.showInformationMessage("ctok: No workspace folder open.");
    return;
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: "ctok: Scanning workspace…", cancellable: false },
    async () => {
      const scanResult = await scan({ root: workspaceRoot, topHeavyCount: 10 });
      // Estimate cost of sending the whole project as context to Claude
      const syntheticPrompt = `Scan of ${scanResult.projectType} project with ${scanResult.totalFiles} files`;
      const analysis = runAnalysis(syntheticPrompt, { plan: getConfig().plan });
      showAnalysisPanel(context, { ...analysis, scanResult }, `Scan: ${scanResult.projectType}`);
    },
  );
}

export function cmdShowPanel(context: vscode.ExtensionContext): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage("ctok: No active editor.");
    return;
  }
  const text = editor.document.getText();
  if (!text.trim()) return;
  const cfg = getConfig();
  const analysis = runAnalysis(text, {
    model: cfg.model || undefined,
    taskType: cfg.taskType,
    plan: cfg.plan,
  });
  const fileName = editor.document.fileName.split(/[\\/]/).pop() ?? "file";
  showAnalysisPanel(context, analysis, fileName);
}
