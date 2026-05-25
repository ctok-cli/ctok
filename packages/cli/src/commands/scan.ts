import ora from "ora";
import { scan } from "@ctok/scanner";
import { header, kvTable, colTable, fmtTokens, c, printJson, divider } from "../output/format";
import { trackEvent } from "../telemetry";

export interface ScanOptions {
  root?: string;
  json?: boolean;
  quiet?: boolean;
  topN?: number;
}

export async function runScan(opts: ScanOptions): Promise<void> {
  const root = opts.root ?? process.cwd();
  const topHeavyCount = opts.topN ?? 10;

  trackEvent("scan", { json: !!opts.json });
  const spinner = ora({ text: `Scanning ${root}…`, color: "cyan" }).start();
  let result: Awaited<ReturnType<typeof scan>>;
  try {
    result = await scan({ root, topHeavyCount });
    spinner.stop();
  } catch (err) {
    spinner.stop();
    throw err;
  }

  if (opts.json) {
    printJson(result);
    return;
  }

  if (opts.quiet) {
    process.stdout.write(
      `${result.projectType}  ${result.totalFiles} files  ${fmtTokens(result.estimatedTokens)} tokens\n`,
    );
    return;
  }

  process.stdout.write(header("Project scan") + "\n");
  process.stdout.write(
    kvTable([
      ["Root", root],
      ["Type", c.bold(result.projectType)],
      ["Files scanned", String(result.totalFiles)],
      ["Files excluded", `${result.excluded.files} (${Object.entries(result.excluded.reasons).map(([k, v]) => `${v} ${k}`).join(", ")})`],
      ["Estimated tokens", c.bold(fmtTokens(result.estimatedTokens))],
    ]) + "\n",
  );

  // Extension breakdown
  const extRows = Object.entries(result.byExtension)
    .sort((a, b) => b[1].tokens - a[1].tokens)
    .slice(0, 8)
    .map(([ext, stat]) => [
      `.${ext}`,
      String(stat.files),
      fmtTokens(stat.tokens),
    ]);

  if (extRows.length > 0) {
    process.stdout.write(header("By extension") + "\n");
    process.stdout.write(colTable(["Ext", "Files", "Tokens"], extRows) + "\n");
  }

  // Top heavy files
  if (result.topHeavyFiles.length > 0) {
    process.stdout.write(header("Heaviest files") + "\n");
    const fileRows = result.topHeavyFiles.map((f) => [f.path, fmtTokens(f.tokens)]);
    process.stdout.write(colTable(["File", "Tokens"], fileRows) + "\n");
  }

  process.stdout.write(divider() + "\n");
  process.stdout.write(
    `  Run ${c.brand('ctok check "<prompt>"')} to estimate cost for a specific task.\n\n`,
  );
}
