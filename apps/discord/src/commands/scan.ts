import type { ChatInputCommandInteraction } from "discord.js";
import { scan } from "@ctok/scanner";
import { buildScanEmbed, buildErrorEmbed } from "../format";

export async function handleScan(interaction: ChatInputCommandInteraction): Promise<void> {
  const directory = interaction.options.getString("directory") ?? process.cwd();

  try {
    const result = await scan({ root: directory });
    const embed = buildScanEmbed(
      {
        totalFiles: result.totalFiles,
        estimatedTokens: result.estimatedTokens,
        projectType: result.projectType,
        topHeavyFiles: result.topHeavyFiles,
      },
      directory,
    );
    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await interaction.editReply({ embeds: [buildErrorEmbed(message)] });
  }
}
