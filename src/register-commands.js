const dotenv = require("dotenv");
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

dotenv.config();

const requiredEnv = [
  "DISCORD_BOT_TOKEN",
  "DISCORD_APPLICATION_ID",
  "DISCORD_GUILD_ID",
];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnv.join(", ")}`
  );
}

const commands = [
  new SlashCommandBuilder()
    .setName("codex")
    .setDescription("Codex へ自然文で指示を送る")
    .addStringOption((option) =>
      option
        .setName("instruction")
        .setDescription("Codex に渡したい指示")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("codex-status")
    .setDescription("context.md ベースで現在の状況を確認する"),
  new SlashCommandBuilder()
    .setName("codex-confirm")
    .setDescription("確認待ちの操作を承認する")
    .addStringOption((option) =>
      option
        .setName("target")
        .setDescription("承認対象の短い識別子や内容")
        .setRequired(false)
    ),
].map((command) => command.toJSON());

async function main() {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.DISCORD_APPLICATION_ID,
      process.env.DISCORD_GUILD_ID
    ),
    { body: commands }
  );

  console.log("Discord slash commands registered.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
