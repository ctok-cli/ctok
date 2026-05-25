import type { ChatInputCommandInteraction } from "discord.js";
import { refine } from "@ctok/refiner";
import { buildRefineEmbed } from "../format";

export async function handleRefine(interaction: ChatInputCommandInteraction): Promise<void> {
  const prompt = interaction.options.getString("prompt", true);
  const result = refine({ prompt });

  const embed = buildRefineEmbed({
    refined: result.refined,
    tokensSaved: result.savedTokens,
    savedPct: result.savedPct,
  });

  await interaction.editReply({ embeds: [embed] });
}
