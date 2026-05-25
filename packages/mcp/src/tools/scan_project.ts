import { scan } from "@ctok/scanner";
import path from "node:path";

export const scanProjectTool = {
  name: "scan_project",
  description:
    "Scan a local project directory and estimate its total token footprint. " +
    "Returns project type, total file count, token estimate, breakdown by file extension, " +
    "the 10 heaviest files, and which patterns were excluded (node_modules, build artifacts, etc.).",
  inputSchema: {
    type: "object" as const,
    properties: {
      path: {
        type: "string",
        description:
          "Absolute or relative path to the project root. Defaults to the current working directory.",
      },
      topHeavyCount: {
        type: "number",
        description: "Number of heaviest files to include in results. Defaults to 10.",
      },
    },
  },
};

export async function runScanProject(args: Record<string, unknown>) {
  const root = args.path
    ? path.resolve(String(args.path))
    : process.cwd();
  const topHeavyCount = typeof args.topHeavyCount === "number"
    ? Math.max(1, Math.min(50, args.topHeavyCount))
    : 10;

  const result = await scan({ root, topHeavyCount });

  return {
    root: result.root,
    projectType: result.projectType,
    totalFiles: result.totalFiles,
    totalBytes: result.totalBytes,
    estimatedTokens: result.estimatedTokens,
    byExtension: result.byExtension,
    topHeavyFiles: result.topHeavyFiles,
    excluded: result.excluded,
  };
}
