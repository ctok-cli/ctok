import { refine } from "@ctok/refiner";
import type { RespondFn, ParsedArgs, RefineOutput } from "../types";
import { buildRefineBlocks } from "../format";

export async function handleRefine(args: ParsedArgs, respond: RespondFn): Promise<void> {
  if (!args.text) {
    await respond({
      blocks: [{ type: "section", text: { type: "mrkdwn", text: "Usage: `/ctok refine <your prompt here>`" } }],
    });
    return;
  }

  const result = refine({ prompt: args.text });

  const output: RefineOutput = {
    refined: result.refined,
    tokensSaved: result.savedTokens,
    savedPct: result.savedPct,
  };

  await respond({
    blocks: buildRefineBlocks(output, args.text),
    response_type: "ephemeral",
  });
}
