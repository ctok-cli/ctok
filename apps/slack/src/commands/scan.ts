import { scan } from "@ctok/scanner";
import type { RespondFn, ParsedArgs, ScanResult } from "../types";
import { buildScanBlocks } from "../format";

export async function handleScan(args: ParsedArgs, respond: RespondFn): Promise<void> {
  const dir = args.text || process.cwd();

  let result;
  try {
    result = await scan({ root: dir });
  } catch (err) {
    await respond({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `❌ *Scan failed:* ${err instanceof Error ? err.message : String(err)}`,
          },
        },
      ],
    });
    return;
  }

  const scanResult: ScanResult = {
    totalFiles: result.totalFiles,
    estimatedTokens: result.estimatedTokens,
    projectType: result.projectType,
    topHeavyFiles: result.topHeavyFiles,
  };

  await respond({
    blocks: buildScanBlocks(scanResult, dir),
    response_type: "in_channel",
  });
}
