#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { estimateTool, runEstimate } from "./tools/estimate.js";
import { refineTool, runRefine } from "./tools/refine.js";
import { recommendModelTool, runRecommendModel } from "./tools/recommend_model.js";
import { scanProjectTool, runScanProject } from "./tools/scan_project.js";

const server = new Server(
  { name: "ctok", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [estimateTool, refineTool, recommendModelTool, scanProjectTool],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const safeArgs = (args ?? {}) as Record<string, unknown>;

  try {
    let result: unknown;

    switch (name) {
      case "estimate":
        result = runEstimate(safeArgs);
        break;
      case "refine":
        result = runRefine(safeArgs);
        break;
      case "recommend_model":
        result = runRecommendModel(safeArgs);
        break;
      case "scan_project":
        result = await runScanProject(safeArgs);
        break;
      default:
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
        };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      isError: true,
      content: [{ type: "text" as const, text: `Error in ${name}: ${message}` }],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`ctok-mcp fatal: ${err}\n`);
  process.exit(1);
});
