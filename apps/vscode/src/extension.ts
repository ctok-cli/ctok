import * as vscode from "vscode";
import { createStatusBar } from "./statusBar";
import { cmdCheck, cmdCheckSelection, cmdRefineSelection, cmdScan, cmdShowPanel } from "./commands";

export function activate(context: vscode.ExtensionContext): void {
  // Status bar
  createStatusBar(context);

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("ctok.check", () => cmdCheck(context)),
    vscode.commands.registerCommand("ctok.checkSelection", () => cmdCheckSelection(context)),
    vscode.commands.registerCommand("ctok.refineSelection", () => cmdRefineSelection(context)),
    vscode.commands.registerCommand("ctok.scan", () => cmdScan(context)),
    vscode.commands.registerCommand("ctok.showPanel", () => cmdShowPanel(context)),
  );
}

export function deactivate(): void {
  // VS Code disposes context.subscriptions automatically
}
