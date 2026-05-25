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
import { runRefine } from "./utils/analysis";
import { fmtTokens } from "./utils/format";

interface Preferences {
  plan: string;
  model: string;
  taskType: string;
}

interface FormValues {
  prompt: string;
}

function RefineResult({ original, refined, tokensSaved }: {
  original: string;
  refined: string;
  tokensSaved: number;
}) {
  const markdown = [
    `# Refined Prompt`,
    ``,
    `**Tokens saved:** ~${fmtTokens(tokensSaved)}`,
    ``,
    `---`,
    ``,
    refined,
    ``,
    `---`,
    ``,
    `<details>`,
    `<summary>Original prompt</summary>`,
    ``,
    original,
    ``,
    `</details>`,
  ].join("\n");

  return (
    <Detail
      markdown={markdown}
      navigationTitle="Refined Prompt"
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Refined Prompt"
            content={refined}
          />
          <Action.CopyToClipboard
            title="Copy Original Prompt"
            content={original}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  );
}

export default function RefineCommand() {
  getPreferenceValues<Preferences>();
  const { push } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(values: FormValues) {
    if (!values.prompt.trim()) {
      showToast({ style: Toast.Style.Failure, title: "Prompt is required" });
      return;
    }
    setIsLoading(true);
    try {
      const { refined, tokensSaved } = runRefine(values.prompt);
      push(
        <RefineResult
          original={values.prompt}
          refined={refined}
          tokensSaved={tokensSaved}
        />,
      );
    } catch (err) {
      showToast({
        style: Toast.Style.Failure,
        title: "Refine failed",
        message: String(err),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Refine Prompt" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="prompt"
        title="Prompt"
        placeholder="Paste your prompt to refine…"
        enableMarkdown={false}
      />
      <Form.Description
        title=""
        text="The 7-pass refiner trims tokens while preserving meaning."
      />
    </Form>
  );
}
