import { REST, Routes } from "discord.js";
import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";

const DISCORD_TOKEN = process.env["DISCORD_TOKEN"];
const DISCORD_CLIENT_ID = process.env["DISCORD_CLIENT_ID"];
const DISCORD_GUILD_ID = process.env["DISCORD_GUILD_ID"]; // optional; omit for global commands

if (!DISCORD_TOKEN) throw new Error("DISCORD_TOKEN is required");
if (!DISCORD_CLIENT_ID) throw new Error("DISCORD_CLIENT_ID is required");

const TASK_TYPES = [
  "general", "bug-fix", "feature", "refactor",
  "review", "architecture", "debugging", "docs", "test",
];

const MODELS = ["haiku-4-5", "sonnet-4-6", "opus-4-7"];
const PLANS = ["free", "pro", "max5x", "max20x", "team", "enterprise", "api"];

const command = new SlashCommandBuilder()
  .setName("ctok")
  .setDescription("Claude token estimator - estimate cost, quota, and more")

  .addSubcommand(
    new SlashCommandSubcommandBuilder()
      .setName("check")
      .setDescription("Estimate tokens, cost, and get a model recommendation")
      .addStringOption((o) =>
        o.setName("prompt").setDescription("The prompt to analyse").setRequired(true)
      )
      .addStringOption((o) =>
        o.setName("model").setDescription("Override model for cost calculation").setRequired(false)
          .addChoices(...MODELS.map((m) => ({ name: m, value: m })))
      )
      .addStringOption((o) =>
        o.setName("plan").setDescription("Your Claude plan (for quota estimate)").setRequired(false)
          .addChoices(...PLANS.map((p) => ({ name: p, value: p })))
      )
      .addStringOption((o) =>
        o.setName("task_type").setDescription("Task hint for model recommendation").setRequired(false)
          .addChoices(...TASK_TYPES.map((t) => ({ name: t, value: t })))
      )
  )

  .addSubcommand(
    new SlashCommandSubcommandBuilder()
      .setName("refine")
      .setDescription("Run the 7-pass prompt refiner to trim tokens and improve clarity")
      .addStringOption((o) =>
        o.setName("prompt").setDescription("The prompt to refine").setRequired(true)
      )
  )

  .addSubcommand(
    new SlashCommandSubcommandBuilder()
      .setName("scan")
      .setDescription("Scan a project directory and report its token footprint")
      .addStringOption((o) =>
        o.setName("directory").setDescription("Absolute path to the directory to scan").setRequired(false)
      )
  )

  .addSubcommand(
    new SlashCommandSubcommandBuilder()
      .setName("help")
      .setDescription("Show available ctok commands")
  );

const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log("Registering slash commands…");

    if (DISCORD_GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID),
        { body: [command.toJSON()] },
      );
      console.log(`Registered to guild ${DISCORD_GUILD_ID} (instant, for testing)`);
    } else {
      await rest.put(
        Routes.applicationCommands(DISCORD_CLIENT_ID),
        { body: [command.toJSON()] },
      );
      console.log("Registered globally (may take up to 1 hour to propagate)");
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
