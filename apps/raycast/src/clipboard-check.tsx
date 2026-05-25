import { Clipboard, getPreferenceValues, showHUD, showToast, Toast } from "@raycast/api";
import { runAnalysis } from "./utils/analysis";
import { fmtTokens, fmtUsd, effortEmoji } from "./utils/format";

interface Preferences {
  plan: string;
  model: string;
  taskType: string;
}

export default async function ClipboardCheckCommand() {
  const prefs = getPreferenceValues<Preferences>();

  const text = await Clipboard.readText();
  if (!text?.trim()) {
    await showToast({ style: Toast.Style.Failure, title: "Clipboard is empty" });
    return;
  }

  try {
    const { result } = runAnalysis(text, {
      plan: prefs.plan,
      model: prefs.model || undefined,
      taskType: prefs.taskType,
    });

    const { estimate, recommendation, cost } = result;
    const tokens = fmtTokens(estimate.input.expected);
    const totalCost = fmtUsd(cost.totalUsd);
    const effort = effortEmoji(recommendation.effort.effort);

    await showHUD(`${effort} ${tokens} tok · ${totalCost} · ${recommendation.model.model}`);
  } catch (err) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Analysis failed",
      message: String(err),
    });
  }
}
