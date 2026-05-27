import { Client, GatewayIntentBits, Events } from "discord.js";
import { handleCheck } from "./commands/check";
import { handleRefine } from "./commands/refine";
import { handleScan } from "./commands/scan";
import { buildHelpEmbed, buildErrorEmbed } from "./format";

const DISCORD_TOKEN = process.env["DISCORD_TOKEN"];
if (!DISCORD_TOKEN) throw new Error("DISCORD_TOKEN is required");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`⚡ ctok Discord bot ready - logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "ctok") return;

  // Defer immediately - analysis may take >3s for scan
  await interaction.deferReply();

  const sub = interaction.options.getSubcommand();

  try {
    switch (sub) {
      case "check":
        await handleCheck(interaction);
        break;
      case "refine":
        await handleRefine(interaction);
        break;
      case "scan":
        await handleScan(interaction);
        break;
      case "help":
        await interaction.editReply({ embeds: [buildHelpEmbed()] });
        break;
      default:
        await interaction.editReply({ embeds: [buildHelpEmbed()] });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    try {
      await interaction.editReply({ embeds: [buildErrorEmbed(message)] });
    } catch {
      // interaction already replied or expired
    }
  }
});

client.login(DISCORD_TOKEN);
