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
import { scan, type ProjectScan } from "@ctok/scanner";
import { fmtTokens } from "./utils/format";

interface Preferences {
  plan: string;
  model: string;
  taskType: string;
}

interface FormValues {
  directory: string;
}

function ScanResultDetail({ result, directory }: { result: ProjectScan; directory: string }) {
  const rows = result.topHeavyFiles
    .map((f) => `| \`${f.path}\` | ${fmtTokens(f.tokens)} |`)
    .join("\n");

  const extRows = Object.entries(result.byExtension)
    .sort((a, b) => b[1].tokens - a[1].tokens)
    .slice(0, 10)
    .map(([ext, info]) => `| ${ext || "(none)"} | ${info.files} | ${fmtTokens(info.tokens)} |`)
    .join("\n");

  const markdown = [
    `# Project Scan — \`${directory}\``,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Project type | ${result.projectType} |`,
    `| Total files | ${result.totalFiles} |`,
    `| Total tokens | ${fmtTokens(result.estimatedTokens)} |`,
    `| Excluded files | ${result.excluded.files} |`,
    ``,
    `## Top Files by Token Count`,
    ``,
    `| File | Tokens |`,
    `|------|--------|`,
    rows || "_No files found_",
    ``,
    `## By Extension`,
    ``,
    `| Extension | Files | Tokens |`,
    `|-----------|-------|--------|`,
    extRows || "_No data_",
  ].join("\n");

  return (
    <Detail
      markdown={markdown}
      navigationTitle="Scan Results"
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Summary" content={markdown} />
        </ActionPanel>
      }
    />
  );
}

export default function ScanCommand() {
  getPreferenceValues<Preferences>();
  const { push } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: FormValues) {
    const dir = values.directory.trim();
    if (!dir) {
      await showToast({ style: Toast.Style.Failure, title: "Directory path is required" });
      return;
    }
    setIsLoading(true);
    const toast = await showToast({ style: Toast.Style.Animated, title: "Scanning…" });
    try {
      const result = await scan({ root: dir });
      await toast.hide();
      push(<ScanResultDetail result={result} directory={dir} />);
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Scan failed",
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
          <Action.SubmitForm title="Scan Directory" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="directory"
        title="Directory"
        placeholder="/path/to/your/project"
      />
      <Form.Description
        title=""
        text="Scans the directory and reports its token footprint."
      />
    </Form>
  );
}
