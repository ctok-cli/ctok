import { App, LogLevel } from "@slack/bolt";
import type { RespondArguments } from "@slack/bolt";
import { parseArgs } from "./parseArgs";
import { handleCheck } from "./commands/check";
import { handleRefine } from "./commands/refine";
import { handleScan } from "./commands/scan";
import { buildHelpBlocks, buildErrorBlock } from "./format";

const SLACK_BOT_TOKEN = process.env["SLACK_BOT_TOKEN"];
const SLACK_SIGNING_SECRET = process.env["SLACK_SIGNING_SECRET"];
const SLACK_APP_TOKEN = process.env["SLACK_APP_TOKEN"]; // Socket Mode
const PORT = parseInt(process.env["PORT"] ?? "3000", 10);

if (!SLACK_BOT_TOKEN) throw new Error("SLACK_BOT_TOKEN is required");
if (!SLACK_SIGNING_SECRET) throw new Error("SLACK_SIGNING_SECRET is required");

const socketMode = Boolean(SLACK_APP_TOKEN);

const app = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET,
  ...(socketMode
    ? { socketMode: true, appToken: SLACK_APP_TOKEN }
    : {}),
  logLevel: process.env["NODE_ENV"] === "production" ? LogLevel.WARN : LogLevel.INFO,
});

// /ctok <subcommand> <text> [--model X] [--plan Y] [--task Z]
app.command("/ctok", async ({ command, ack, respond }) => {
  await ack();

  const args = parseArgs(command.text ?? "");

  try {
    switch (args.subcommand) {
      case "check":
        await handleCheck(args, respond);
        break;
      case "refine":
        await handleRefine(args, respond);
        break;
      case "scan":
        await handleScan(args, respond);
        break;
      case "help":
      default:
        await respond({ blocks: buildHelpBlocks() });
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await respond({ blocks: buildErrorBlock(message) });
  }
});

// Also respond to @mentions: "@ctok check <prompt>"
app.event("app_mention", async ({ event, say }) => {
  const text = (event.text ?? "").replace(/<@[A-Z0-9]+>/g, "").trim();
  if (!text) {
    await say({ blocks: buildHelpBlocks() });
    return;
  }

  const args = parseArgs(text);
  const thread_ts = event.ts;

  const sayRespond = async (opts: RespondArguments) => {
    await say({ ...opts, thread_ts });
  };

  try {
    switch (args.subcommand) {
      case "check":
        await handleCheck(args, sayRespond);
        break;
      case "refine":
        await handleRefine(args, sayRespond);
        break;
      case "scan":
        await handleScan(args, sayRespond);
        break;
      default:
        await say({ blocks: buildHelpBlocks(), thread_ts });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await say({ blocks: buildErrorBlock(message), thread_ts });
  }
});

(async () => {
  if (socketMode) {
    await app.start();
    console.log(`⚡ ctok Slack bot started (Socket Mode)`);
  } else {
    await app.start(PORT);
    console.log(`⚡ ctok Slack bot started on port ${PORT}`);
  }
})();
