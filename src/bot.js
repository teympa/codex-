const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const {
  Client,
  Events,
  GatewayIntentBits,
  SlashCommandBuilder,
} = require("discord.js");

dotenv.config();

const requiredEnv = ["DISCORD_BOT_TOKEN"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnv.join(", ")}`
  );
}

const CONTEXT_PATH = path.resolve(__dirname, "..", "context.md");

function readContextPreview() {
  try {
    const text = fs.readFileSync(CONTEXT_PATH, "utf8");
    const lines = text
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .slice(0, 16);
    return lines.join("\n");
  } catch (error) {
    return "context.md could not be read.";
  }
}

function buildCodexReply(instruction) {
  return [
    "Codex への指示を受け取りました。",
    "",
    `内容: ${instruction}`,
    "",
    "この MVP では、Discord からの指示受付と結果返却の窓口だけを用意しています。",
    "次段階で Codex 実行ランナーや Notion / GitHub 連携へつなぎます。"
  ].join("\n");
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

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Discord bot ready as ${readyClient.user.tag}`);
  console.log(`Commands defined: ${commands.map((c) => c.name).join(", ")}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName === "codex") {
    const instruction = interaction.options.getString("instruction", true);
    await interaction.reply({
      content: buildCodexReply(instruction),
      ephemeral: true,
    });
    return;
  }

  if (interaction.commandName === "codex-status") {
    await interaction.reply({
      content: [
        "現在の `context.md` プレビューです。",
        "```md",
        readContextPreview(),
        "```",
      ].join("\n"),
      ephemeral: true,
    });
    return;
  }

  if (interaction.commandName === "codex-confirm") {
    const target = interaction.options.getString("target") || "latest pending action";
    await interaction.reply({
      content: [
        `確認指示を受け取りました: ${target}`,
        "この MVP では confirm の受付だけを実装しています。",
        "次段階で保留中アクション管理へつなぎます。",
      ].join("\n"),
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
