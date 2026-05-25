import {
  Action,
  ActionPanel,
  Detail,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { loadHistory, type HistoryEntry } from "./utils/history";
import { fmtTokens, fmtUsd, effortEmoji } from "./utils/format";

function HistoryEntryDetail({ entry }: { entry: HistoryEntry }) {
  const { estimate, recommendation, cost } = entry.result;
  const date = new Date(entry.timestamp).toLocaleString();

  const markdown = [
    `# Token Estimate`,
    ``,
    `**Date:** ${date}  `,
    `**Task type:** ${entry.result.estimate.confidence ?? "general"}`,
    ``,
    `## Tokens`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Input | ${fmtTokens(estimate.input.expected)} |`,
    `| Output | ${fmtTokens(estimate.output.expected)} |`,
    `| Confidence | ${estimate.confidence} |`,
    ``,
    `## Cost`,
    ``,
    `| | Amount |`,
    `|---|---|`,
    `| Input | ${fmtUsd(cost.inputUsd)} |`,
    `| Output | ${fmtUsd(cost.outputUsd)} |`,
    `| Total | ${fmtUsd(cost.totalUsd)} |`,
    ``,
    `## Recommendation`,
    ``,
    `${effortEmoji(recommendation.effort.effort)} **${recommendation.effort.effort}** — ${recommendation.model.model}`,
    ``,
    recommendation.model.reason,
    ``,
    `## Prompt`,
    ``,
    `\`\`\``,
    entry.prompt.slice(0, 500) + (entry.prompt.length > 500 ? "\n…" : ""),
    `\`\`\``,
  ].join("\n");

  return (
    <Detail
      markdown={markdown}
      navigationTitle="History Entry"
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Prompt" content={entry.prompt} />
          <Action.CopyToClipboard
            title="Copy Summary"
            content={markdown}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  );
}

export default function HistoryCommand() {
  const { push } = useNavigation();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const history = loadHistory();
      setEntries([...history].reverse());
    } catch (err) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to load history",
        message: String(err),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (!isLoading && entries.length === 0) {
    return (
      <List isLoading={false}>
        <List.EmptyView
          icon={Icon.Clock}
          title="No history yet"
          description="Run a token check to get started."
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} navigationTitle="Token Check History">
      {entries.map((entry, i) => {
        const date = new Date(entry.timestamp).toLocaleDateString();
        const tokens = fmtTokens(entry.result.estimate.input.expected);
        const totalCost = fmtUsd(entry.result.cost.totalUsd);
        const snippet = entry.prompt.slice(0, 60).replace(/\n/g, " ");

        return (
          <List.Item
            key={entry.id ?? i}
            icon={Icon.Clock}
            title={snippet + (entry.prompt.length > 60 ? "…" : "")}
            subtitle={`${tokens} tok · ${totalCost}`}
            accessories={[{ text: date }]}
            actions={
              <ActionPanel>
                <Action
                  title="View Details"
                  icon={Icon.Eye}
                  onAction={() => push(<HistoryEntryDetail entry={entry} />)}
                />
                <Action.CopyToClipboard title="Copy Prompt" content={entry.prompt} />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
