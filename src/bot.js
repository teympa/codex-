const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");
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
const WORKSPACE_ROOT = path.resolve(__dirname, "..");
const CODEX_BIN = process.platform === "win32" ? "codex.cmd" : "codex";
const pendingConfirmations = new Map();
const MAX_DISCORD_MESSAGE = 1900;

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

function trimForDiscord(text) {
  if (text.length <= MAX_DISCORD_MESSAGE) {
    return text;
  }

  return `${text.slice(0, MAX_DISCORD_MESSAGE - 40)}\n\n[truncated]`;
}

function normalizeInstruction(text) {
  return text.trim();
}

function needsConfirmation(instruction) {
  const riskyPatterns = [
    /\bcommit\b/i,
    /\bpush\b/i,
    /\bdelete\b/i,
    /\bremove\b/i,
    /\bwrite\b/i,
    /\bedit\b/i,
    /\bmodify\b/i,
    /\bcreate file\b/i,
    /\bupdate\b/i,
    /\binstall\b/i,
  ];

  return riskyPatterns.some((pattern) => pattern.test(instruction));
}

function createPendingConfirmation(instruction, userTag) {
  const token = crypto.randomBytes(3).toString("hex");
  pendingConfirmations.set(token, {
    instruction,
    createdAt: Date.now(),
    userTag,
  });
  return token;
}

function buildConfirmationReply(token, instruction) {
  return [
    "この指示は変更系の可能性があるため確認待ちにしました。",
    "",
    `token: ${token}`,
    `instruction: ${instruction}`,
    "",
    `続ける場合は \`/codex-confirm target:${token}\` を実行してください。`,
  ].join("\n");
}

function runCodexExec(instruction, mode = "read-only") {
  const outputFile = path.join(
    os.tmpdir(),
    `codex-discord-output-${Date.now()}-${crypto.randomBytes(3).toString("hex")}.txt`
  );

  const args = [
    "exec",
    instruction,
    "--skip-git-repo-check",
    "--output-last-message",
    outputFile,
    "--color",
    "never",
    "-C",
    WORKSPACE_ROOT,
  ];

  if (mode === "workspace-write") {
    args.push("--full-auto");
  } else {
    args.push("--sandbox", "read-only");
  }

  return new Promise((resolve, reject) => {
    const child = spawn(CODEX_BIN, args, {
      cwd: WORKSPACE_ROOT,
      shell: process.platform === "win32",
    });

    let stdout = "";
    let stderr = "";
    let finished = false;
    const timer = setTimeout(() => {
      if (!finished) {
        child.kill();
      }
    }, 600000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      finished = true;
      let output = "";

      try {
        if (fs.existsSync(outputFile)) {
          output = fs.readFileSync(outputFile, "utf8").trim();
          fs.unlinkSync(outputFile);
        }
      } catch (fileError) {
        output = output || "";
      }

      if (code !== 0) {
        reject(
          new Error(
            [
              `Codex execution failed.`,
              stderr?.trim() || stdout?.trim() || `Exit code: ${code}`,
              output ? `Partial output:\n${output}` : "",
            ]
              .filter(Boolean)
              .join("\n\n")
          )
        );
        return;
      }

      resolve(output || stdout.trim() || "Codex completed without a message.");
    });
  });
}

async function handleCodexInstruction(interaction, instruction, mode = "read-only") {
  await interaction.deferReply({ ephemeral: true });

  try {
    const result = await runCodexExec(instruction, mode);
    await interaction.editReply(trimForDiscord(result));
  } catch (error) {
    await interaction.editReply(
      trimForDiscord(
        [
          "Codex の実行でエラーが発生しました。",
          "",
          error.message,
        ].join("\n")
      )
    );
  }
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
    const instruction = normalizeInstruction(
      interaction.options.getString("instruction", true)
    );

    if (needsConfirmation(instruction)) {
      const token = createPendingConfirmation(instruction, interaction.user.tag);
      await interaction.reply({
        content: buildConfirmationReply(token, instruction),
        ephemeral: true,
      });
      return;
    }

    await handleCodexInstruction(interaction, instruction, "read-only");
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
    const target = interaction.options.getString("target") || "";
    const pending = pendingConfirmations.get(target);

    if (!pending) {
      await interaction.reply({
        content: "確認対象が見つかりませんでした。token を確認してください。",
        ephemeral: true,
      });
      return;
    }

    pendingConfirmations.delete(target);
    await handleCodexInstruction(interaction, pending.instruction, "workspace-write");
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
