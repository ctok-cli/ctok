import {
  Action,
  ActionPanel,
  Detail,
  Form,
  getPreferenceValues,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useState } from "react";
import { runAnalysis, type AnalysisOptions } from "./utils/analysis";
import { fmtTokens, fmtUsd, fmtPct, effortEmoji, confidenceBadge } from "./utils/format";

interface Preferences {
  plan: string;
  model: string;
  taskType: string;
}

interface FormValues {
  prompt: string;
  taskType: string;
}

function ResultDetail({
  prompt,
  opts,
}: {
  prompt: string;
  opts: AnalysisOptions;
}) {
  const { result, quota, contextPct } = runAnalysis(prompt, opts);
  const { estimate, recommendation, suggestions, cost } = result;

  const sections: string[] = [
    `# Token Estimate\n`,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Input tokens | ${fmtTokens(estimate.input.min)}–${fmtTokens(estimate.input.max)} (est. ${fmtTokens(estimate.input.expected)}) |`,
    `| Output tokens | ${fmtTokens(estimate.output.min)}–${fmtTokens(estimate.output.max)} |`,
    `| Context window | ${fmtPct(contextPct)} used |`,
    `| Confidence | ${confidenceBadge(estimate.confidence)} |`,
    ``,
    `## Cost Estimate`,
    ``,
    `| | Cost |`,
    `|---|---|`,
    `| Input | ${fmtUsd(cost.inputUsd)} |`,
    `| Output | ${fmtUsd(cost.outputUsd)} |`,
    `| Total | ${fmtUsd(cost.totalUsd)} |`,
    `| Range | ${fmtUsd(cost.totalUsdRange.min)}–${fmtUsd(cost.totalUsdRange.max)} |`,
    ``,
    `## Recommendation`,
    ``,
    `${effortEmoji(recommendation.effort.effort)} **Effort:** ${recommendation.effort.effort}  `,
    `**Model:** ${recommendation.model.model}  `,
    `**Reason:** ${recommendation.model.reason}`,
  ];

  if (suggestions.length > 0) {
    sections.push(`\n## Suggestions\n`);
    for (const s of suggestions) {
      sections.push(`- **${s.title}**: ${s.detail}`);
    }
  }

  if (quota && !quota.unlimited) {
    sections.push(`\n## Quota Impact\n`);
    sections.push(`| Metric | Value |`);
    sections.push(`|--------|-------|`);
    if (quota.percentOf5hWindow !== null) {
      sections.push(`| 5-hour window used | ${fmtPct(quota.percentOf5hWindow / 100)} |`);
    }
    if (quota.percentOfDailyBudget !== null) {
      sections.push(`| Daily budget used | ${fmtPct(quota.percentOfDailyBudget / 100)} |`);
    }
    sections.push(`| Summary | ${quota.summary} |`);
  }

  const markdown = sections.join("\n");

  return (
    <Detail
      markdown={markdown}
      navigationTitle="Token Estimate"
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Summary"
            content={markdown}
          />
        </ActionPanel>
      }
    />
  );
}

export default function CheckCommand() {
  const prefs = getPreferenceValues<Preferences>();
  const { push } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: FormValues) {
    if (!values.prompt.trim()) {
      await showToast({ style: Toast.Style.Failure, title: "Prompt is required" });
      return;
    }
    setIsLoading(true);
    try {
      const opts: AnalysisOptions = {
        plan: prefs.plan,
        model: prefs.model || undefined,
        taskType: values.taskType || prefs.taskType,
      };
      push(<ResultDetail prompt={values.prompt} opts={opts} />);
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Analysis failed",
        message: String(err),
      });
    } finally {
      setIsLoading(false);
    }
  }

  const taskTypes = [
    { title: "General", value: "general" },
    { title: "Bug Fix", value: "bug-fix" },
    { title: "Feature", value: "feature" },
    { title: "Refactor", value: "refactor" },
    { title: "Review", value: "review" },
    { title: "Architecture", value: "architecture" },
    { title: "Debugging", value: "debugging" },
    { title: "Documentation", value: "docs" },
    { title: "Tests", value: "test" },
  ];

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Estimate Tokens" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="prompt"
        title="Prompt"
        placeholder="Paste your Claude prompt here…"
        enableMarkdown={false}
      />
      <Form.Dropdown id="taskType" title="Task Type" defaultValue={prefs.taskType}>
        {taskTypes.map((t) => (
          <Form.Dropdown.Item key={t.value} value={t.value} title={t.title} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
