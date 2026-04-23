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
const { buildStatusSummary } = require("./status-summary");

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
const NODE_BIN = process.execPath;
const RUNTIME_DIR = path.resolve(__dirname, "..", "runtime");
const COMMAND_LOG_PATH = path.join(RUNTIME_DIR, "discord-command-log.jsonl");
const PENDING_CONFIRMATIONS_PATH = path.join(
  RUNTIME_DIR,
  "pending-confirmations.json"
);
const SYNC_TASKS_SCRIPT_PATH = path.resolve(__dirname, "sync-tasks.js");
const GENERATE_PROPOSAL_SCRIPT_PATH = path.resolve(__dirname, "generate-proposal.js");
const GENERATE_ISSUE_SEEDS_SCRIPT_PATH = path.resolve(__dirname, "generate-issue-seeds.js");
const GENERATE_SPEC_SCRIPT_PATH = path.resolve(__dirname, "generate-spec-from-proposal.js");
const CREATE_GITHUB_ISSUES_SCRIPT_PATH = path.resolve(
  __dirname,
  "create-github-issues-from-seeds.js"
);
const pendingConfirmations = new Map();
const MAX_DISCORD_MESSAGE = 1900;
const PENDING_CONFIRMATION_TTL_MS = 24 * 60 * 60 * 1000;
const REPLY_EPHEMERAL = String(
  process.env.DISCORD_REPLY_EPHEMERAL ?? "true"
).toLowerCase() !== "false";
const DEFAULT_EXEC_MODE = String(
  process.env.DISCORD_CODEX_EXEC_MODE ?? "read-only"
).toLowerCase();
const ALLOWED_GUILD_IDS = parseIdSet(
  process.env.DISCORD_ALLOWED_GUILD_IDS ?? process.env.DISCORD_GUILD_ID
);
const ALLOWED_CHANNEL_IDS = parseIdSet(process.env.DISCORD_ALLOWED_CHANNEL_IDS);
const ALLOWED_USER_IDS = parseIdSet(process.env.DISCORD_ALLOWED_USER_IDS);
const SYNC_APPLY_CHANNEL_IDS = parseIdSet(process.env.DISCORD_SYNC_APPLY_CHANNEL_IDS);
const ISSUE_APPLY_CHANNEL_IDS = parseIdSet(
  process.env.DISCORD_ISSUE_APPLY_CHANNEL_IDS ?? process.env.DISCORD_SYNC_APPLY_CHANNEL_IDS
);

function parseIdSet(rawValue) {
  if (!rawValue) {
    return new Set();
  }

  return new Set(
    rawValue
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

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

function ensureRuntimeDir() {
  if (!fs.existsSync(RUNTIME_DIR)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  }
}

function appendCommandLog(entry) {
  try {
    ensureRuntimeDir();
    fs.appendFileSync(
      COMMAND_LOG_PATH,
      `${JSON.stringify({ timestamp: new Date().toISOString(), ...entry })}\n`,
      "utf8"
    );
  } catch (error) {
    console.error("Failed to write Discord command log", error);
  }
}

function loadPendingConfirmations() {
  try {
    ensureRuntimeDir();

    if (!fs.existsSync(PENDING_CONFIRMATIONS_PATH)) {
      return;
    }

    const raw = fs.readFileSync(PENDING_CONFIRMATIONS_PATH, "utf8");
    if (!raw.trim()) {
      return;
    }

    const parsed = JSON.parse(raw);
    const now = Date.now();

    for (const [token, pending] of Object.entries(parsed)) {
      if (
        pending &&
        pending.instruction &&
        pending.createdAt &&
        now - pending.createdAt < PENDING_CONFIRMATION_TTL_MS
      ) {
        pendingConfirmations.set(token, pending);
      }
    }
  } catch (error) {
    console.error("Failed to load pending confirmations", error);
  }
}

function savePendingConfirmations() {
  try {
    ensureRuntimeDir();
    const serialized = Object.fromEntries(pendingConfirmations.entries());
    fs.writeFileSync(
      PENDING_CONFIRMATIONS_PATH,
      `${JSON.stringify(serialized, null, 2)}\n`,
      "utf8"
    );
  } catch (error) {
    console.error("Failed to save pending confirmations", error);
  }
}

function pruneExpiredConfirmations() {
  const now = Date.now();
  let removed = 0;

  for (const [token, pending] of pendingConfirmations.entries()) {
    if (!pending?.createdAt || now - pending.createdAt >= PENDING_CONFIRMATION_TTL_MS) {
      pendingConfirmations.delete(token);
      removed += 1;
    }
  }

  if (removed > 0) {
    savePendingConfirmations();
    appendCommandLog({
      event: "confirmation_pruned",
      removed,
    });
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

function validateAccess(interaction) {
  const failures = [];

  if (
    ALLOWED_GUILD_IDS.size > 0 &&
    (!interaction.guildId || !ALLOWED_GUILD_IDS.has(interaction.guildId))
  ) {
    failures.push("guild");
  }

  if (
    ALLOWED_CHANNEL_IDS.size > 0 &&
    (!interaction.channelId || !ALLOWED_CHANNEL_IDS.has(interaction.channelId))
  ) {
    failures.push("channel");
  }

  if (
    ALLOWED_USER_IDS.size > 0 &&
    (!interaction.user?.id || !ALLOWED_USER_IDS.has(interaction.user.id))
  ) {
    failures.push("user");
  }

  return {
    allowed: failures.length === 0,
    failures,
  };
}

function buildAccessDeniedReply() {
  return [
    "この Bot は現在この場所またはユーザーでは使えません。",
    "",
    "許可された Discord サーバー / チャンネル / ユーザー設定を確認してください。",
  ].join("\n");
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
    /更新/,
    /修正/,
    /変更/,
    /編集/,
    /作成/,
    /追加/,
    /削除/,
    /書き換/,
    /保存/,
    /反映/,
    /実装/,
    /インストール/,
  ];

  return riskyPatterns.some((pattern) => pattern.test(instruction));
}

function createPendingConfirmation(instruction, user) {
  const token = crypto.randomBytes(3).toString("hex");
  pendingConfirmations.set(token, {
    instruction,
    createdAt: Date.now(),
    userId: user.id,
    userTag: user.tag,
  });
  savePendingConfirmations();
  appendCommandLog({
    event: "confirmation_created",
    token,
    userId: user.id,
    userTag: user.tag,
    instruction,
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

function buildConfirmationRejectedReply() {
  return "この確認 token は発行された本人だけが承認できます。";
}

function formatAge(createdAt) {
  const elapsedMs = Math.max(0, Date.now() - createdAt);
  const totalMinutes = Math.floor(elapsedMs / 60000);

  if (totalMinutes < 1) {
    return "<1m";
  }

  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function shortenInstruction(instruction, maxLength = 80) {
  if (instruction.length <= maxLength) {
    return instruction;
  }

  return `${instruction.slice(0, maxLength - 3)}...`;
}

function buildPendingSummary() {
  pruneExpiredConfirmations();

  if (pendingConfirmations.size === 0) {
    return "確認待ちはありません。";
  }

  const entries = [...pendingConfirmations.entries()]
    .sort((a, b) => b[1].createdAt - a[1].createdAt)
    .slice(0, 10)
    .map(([token, pending]) => {
      const age = formatAge(pending.createdAt);
      const owner = pending.userTag || pending.userId || "unknown";
      const instruction = shortenInstruction(pending.instruction);
      return `- ${token} | ${age} | ${owner} | ${instruction}`;
    });

  const lines = [
    `確認待ち: ${pendingConfirmations.size}件`,
    ...entries,
  ];

  if (pendingConfirmations.size > entries.length) {
    lines.push(`- 他 ${pendingConfirmations.size - entries.length} 件`);
  }

  return lines.join("\n");
}

function parseCommandLogLines(limit = 10) {
  ensureRuntimeDir();

  if (!fs.existsSync(COMMAND_LOG_PATH)) {
    return [];
  }

  const lines = fs
    .readFileSync(COMMAND_LOG_PATH, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-limit);

  return lines
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean);
}

function formatLogTimestamp(timestamp) {
  if (!timestamp) {
    return "unknown";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortenLogText(text, maxLength = 60) {
  if (!text) {
    return "";
  }

  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3)}...`;
}

function formatCommandLogEntry(entry) {
  const time = formatLogTimestamp(entry.timestamp);
  const event = entry.event || "unknown";
  const actor = entry.userTag || "system";
  const details = [];

  if (entry.commandName) {
    details.push(entry.commandName);
  }

  if (entry.token) {
    details.push(`token:${entry.token}`);
  }

  if (entry.dryRun !== undefined) {
    details.push(entry.dryRun ? "dry-run" : "apply");
  }

  if (entry.error) {
    details.push(shortenLogText(entry.error));
  } else if (entry.instruction) {
    details.push(shortenLogText(entry.instruction));
  }

  return `- ${time} | ${event} | ${actor}${details.length ? ` | ${details.join(" | ")}` : ""}`;
}

function buildCommandLogSummary(limit = 8) {
  const entries = parseCommandLogLines(limit);

  if (entries.length === 0) {
    return "実行ログはまだありません。";
  }

  return [
    `最新ログ: ${entries.length}件`,
    ...entries.map((entry) => formatCommandLogEntry(entry)),
  ].join("\n");
}

function formatIdSet(set) {
  if (!set || set.size === 0) {
    return "(not set)";
  }

  return [...set].join(", ");
}

function buildEnvironmentSummary(interaction) {
  return [
    "**Discord Environment**",
    `- guild_id: ${interaction.guildId || "(none)"}`,
    `- channel_id: ${interaction.channelId || "(none)"}`,
    `- user_id: ${interaction.user?.id || "(none)"}`,
    `- user_tag: ${interaction.user?.tag || "(unknown)"}`,
    "",
    "**Configured Allowlists**",
    `- DISCORD_ALLOWED_GUILD_IDS: ${formatIdSet(ALLOWED_GUILD_IDS)}`,
    `- DISCORD_ALLOWED_CHANNEL_IDS: ${formatIdSet(ALLOWED_CHANNEL_IDS)}`,
    `- DISCORD_ALLOWED_USER_IDS: ${formatIdSet(ALLOWED_USER_IDS)}`,
    `- DISCORD_SYNC_APPLY_CHANNEL_IDS: ${formatIdSet(SYNC_APPLY_CHANNEL_IDS)}`,
    `- DISCORD_ISSUE_APPLY_CHANNEL_IDS: ${formatIdSet(ISSUE_APPLY_CHANNEL_IDS)}`,
  ].join("\n");
}

function canApplyTaskSync(interaction) {
  if (SYNC_APPLY_CHANNEL_IDS.size === 0) {
    return {
      allowed: false,
      reason: "DISCORD_SYNC_APPLY_CHANNEL_IDS が未設定です。",
    };
  }

  if (!interaction.channelId || !SYNC_APPLY_CHANNEL_IDS.has(interaction.channelId)) {
    return {
      allowed: false,
      reason: "このチャンネルでは本実行できません。",
    };
  }

  return {
    allowed: true,
    reason: "",
  };
}

function buildTaskSyncApplyDeniedReply(reason) {
  return [
    "GitHub / Notion Tasks 同期の本実行はこの条件では許可されていません。",
    "",
    reason,
    "",
    "まずは `dry_run:true` で確認してください。",
  ].join("\n");
}

function canApplyIssueCreation(interaction) {
  if (ISSUE_APPLY_CHANNEL_IDS.size === 0) {
    return {
      allowed: false,
      reason: "DISCORD_ISSUE_APPLY_CHANNEL_IDS が未設定です。",
    };
  }

  if (!interaction.channelId || !ISSUE_APPLY_CHANNEL_IDS.has(interaction.channelId)) {
    return {
      allowed: false,
      reason: "このチャンネルでは GitHub Issue 作成を本実行できません。",
    };
  }

  return {
    allowed: true,
    reason: "",
  };
}

function buildIssueCreationDeniedReply(reason) {
  return [
    "GitHub Issue 作成の本実行はこの条件では許可されていません。",
    "",
    reason,
    "",
    "まずは `dry_run:true` で確認してください。",
  ].join("\n");
}

function runNodeScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(NODE_BIN, [scriptPath, ...args], {
      cwd: WORKSPACE_ROOT,
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() || stdout.trim() || `Script execution failed with exit code ${code}`
          )
        );
        return;
      }

      resolve((stdout || stderr).trim() || "Script completed without output.");
    });
  });
}

async function handleTaskSync(interaction, dryRun) {
  await interaction.deferReply({ ephemeral: REPLY_EPHEMERAL });
  appendCommandLog({
    event: "task_sync_requested",
    commandName: interaction.commandName,
    userTag: interaction.user.tag,
    channelId: interaction.channelId,
    dryRun,
  });

  try {
    const output = await runNodeScript(
      SYNC_TASKS_SCRIPT_PATH,
      dryRun ? ["--dry-run"] : []
    );

    appendCommandLog({
      event: "task_sync_succeeded",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
      dryRun,
      resultPreview: trimForDiscord(output),
    });

    const lines = [
      dryRun ? "GitHub / Notion Tasks 同期の dry-run が完了しました。" : "GitHub / Notion Tasks 同期が完了しました。",
      "",
      "```",
      trimForDiscord(output),
      "```",
    ];

    await interaction.editReply(lines.join("\n"));
  } catch (error) {
    appendCommandLog({
      event: "task_sync_failed",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
      dryRun,
      error: error.message,
    });
    await interaction.editReply(
      trimForDiscord(
        [
          "GitHub / Notion Tasks 同期でエラーが発生しました。",
          "",
          error.message,
        ].join("\n")
      )
    );
  }
}

function collectProposalArgs(interaction) {
  const optionMap = [
    ["title", "title"],
    ["project", "project"],
    ["genre", "genre"],
    ["platform", "platform"],
    ["audience", "audience"],
    ["core_hook", "coreHook"],
    ["mode", "mode"],
  ];

  const args = [];
  for (const [optionName, cliName] of optionMap) {
    const value = interaction.options.getString(optionName);
    if (value) {
      args.push(`--${cliName}`, value);
    }
  }

  return args;
}

async function handleProposalGeneration(interaction) {
  await interaction.deferReply({ ephemeral: REPLY_EPHEMERAL });
  const title = interaction.options.getString("title", true);
  const args = collectProposalArgs(interaction);

  appendCommandLog({
    event: "proposal_generation_requested",
    commandName: interaction.commandName,
    userTag: interaction.user.tag,
    channelId: interaction.channelId,
    title,
  });

  try {
    const output = await runNodeScript(GENERATE_PROPOSAL_SCRIPT_PATH, args);
    appendCommandLog({
      event: "proposal_generation_succeeded",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
      title,
      resultPreview: trimForDiscord(output),
    });

    await interaction.editReply(
      trimForDiscord(
        [
          "企画書ドラフトを生成しました。",
          "",
          "```",
          output,
          "```",
          "",
          "次は内容を埋めてから、必要に応じて Notion `Specs` や GitHub Issue へ分解してください。",
        ].join("\n")
      )
    );
  } catch (error) {
    appendCommandLog({
      event: "proposal_generation_failed",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
      title,
      error: error.message,
    });

    await interaction.editReply(
      trimForDiscord(
        [
          "企画書ドラフト生成でエラーが発生しました。",
          "",
          error.message,
        ].join("\n")
      )
    );
  }
}

async function handleIssueSeedGeneration(interaction) {
  await interaction.deferReply({ ephemeral: REPLY_EPHEMERAL });
  const proposalFile = interaction.options.getString("proposal_file", true);

  appendCommandLog({
    event: "issue_seed_generation_requested",
    commandName: interaction.commandName,
    userTag: interaction.user.tag,
    channelId: interaction.channelId,
    proposalFile,
  });

  try {
    const output = await runNodeScript(GENERATE_ISSUE_SEEDS_SCRIPT_PATH, [
      "--file",
      proposalFile,
    ]);

    appendCommandLog({
      event: "issue_seed_generation_succeeded",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
      proposalFile,
      resultPreview: trimForDiscord(output),
    });

    await interaction.editReply(
      trimForDiscord(
        [
          "Issue 下書きを生成しました。",
          "",
          "```",
          output,
          "```",
          "",
          "次は生成された Markdown を確認して、GitHub Issue に貼り付けてください。",
        ].join("\n")
      )
    );
  } catch (error) {
    appendCommandLog({
      event: "issue_seed_generation_failed",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
      proposalFile,
      error: error.message,
    });

    await interaction.editReply(
      trimForDiscord(
        [
          "Issue 下書き生成でエラーが発生しました。",
          "",
          error.message,
        ].join("\n")
      )
    );
  }
}

async function handleSpecGeneration(interaction) {
  await interaction.deferReply({ ephemeral: REPLY_EPHEMERAL });
  const proposalFile = interaction.options.getString("proposal_file", true);

  appendCommandLog({
    event: "spec_generation_requested",
    commandName: interaction.commandName,
    userTag: interaction.user.tag,
    channelId: interaction.channelId,
    proposalFile,
  });

  try {
    const output = await runNodeScript(GENERATE_SPEC_SCRIPT_PATH, [
      "--file",
      proposalFile,
    ]);

    appendCommandLog({
      event: "spec_generation_succeeded",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
      proposalFile,
      resultPreview: trimForDiscord(output),
    });

    await interaction.editReply(
      trimForDiscord(
        [
          "Spec draft を生成しました。",
          "",
          "```",
          output,
          "```",
          "",
          "次は `drafts/specs/` の内容を整えてから Notion `Specs` に移してください。",
        ].join("\n")
      )
    );
  } catch (error) {
    appendCommandLog({
      event: "spec_generation_failed",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
      proposalFile,
      error: error.message,
    });

    await interaction.editReply(
      trimForDiscord(
        [
          "Spec draft 生成でエラーが発生しました。",
          "",
          error.message,
        ].join("\n")
      )
    );
  }
}

async function handleGithubIssueCreation(interaction, dryRun) {
  await interaction.deferReply({ ephemeral: REPLY_EPHEMERAL });
  const issueSeedFile = interaction.options.getString("issue_seed_file", true);
  const args = ["--file", issueSeedFile];
  if (!dryRun) {
    args.push("--apply");
  }

  appendCommandLog({
    event: "github_issue_creation_requested",
    commandName: interaction.commandName,
    userTag: interaction.user.tag,
    channelId: interaction.channelId,
    issueSeedFile,
    dryRun,
  });

  try {
    const output = await runNodeScript(CREATE_GITHUB_ISSUES_SCRIPT_PATH, args);

    appendCommandLog({
      event: "github_issue_creation_succeeded",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
      issueSeedFile,
      dryRun,
      resultPreview: trimForDiscord(output),
    });

    await interaction.editReply(
      trimForDiscord(
        [
          dryRun ? "GitHub Issue 作成 dry-run が完了しました。" : "GitHub Issue 作成が完了しました。",
          "",
          "```",
          output,
          "```",
        ].join("\n")
      )
    );
  } catch (error) {
    appendCommandLog({
      event: "github_issue_creation_failed",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
      issueSeedFile,
      dryRun,
      error: error.message,
    });

    await interaction.editReply(
      trimForDiscord(
        [
          "GitHub Issue 作成でエラーが発生しました。",
          "",
          error.message,
        ].join("\n")
      )
    );
  }
}

function runCodexExec(instruction, mode = "read-only") {
  const outputFile = path.join(
    os.tmpdir(),
    `codex-discord-output-${Date.now()}-${crypto.randomBytes(3).toString("hex")}.txt`
  );

  const args = [
    "exec",
    "-",
    "--skip-git-repo-check",
    "--output-last-message",
    outputFile,
    "--color",
    "never",
    "-C",
    WORKSPACE_ROOT,
  ];

  if (mode === "workspace-write") {
    args.push("--dangerously-bypass-approvals-and-sandbox");
  } else if (mode === "bypass") {
    args.push("--dangerously-bypass-approvals-and-sandbox");
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

    child.stdin.write(instruction);
    child.stdin.end();

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
  await interaction.deferReply({ ephemeral: REPLY_EPHEMERAL });
  appendCommandLog({
    event: "execution_started",
    commandName: interaction.commandName,
    userTag: interaction.user.tag,
    channelId: interaction.channelId,
    mode,
    instruction,
  });

  try {
    const result = await runCodexExec(instruction, mode);
    appendCommandLog({
      event: "execution_succeeded",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
      mode,
      instruction,
      resultPreview: trimForDiscord(result),
    });
    await interaction.editReply(trimForDiscord(result));
  } catch (error) {
    appendCommandLog({
      event: "execution_failed",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
      mode,
      instruction,
      error: error.message,
    });
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
  new SlashCommandBuilder()
    .setName("codex-pending")
    .setDescription("確認待ちの一覧を確認する"),
  new SlashCommandBuilder()
    .setName("codex-sync-tasks")
    .setDescription("GitHub と Notion Tasks の同期を実行する")
    .addBooleanOption((option) =>
      option
        .setName("dry_run")
        .setDescription("更新はせず確認だけ行う")
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("codex-log")
    .setDescription("実行ログの最新数件を確認する")
    .addIntegerOption((option) =>
      option
        .setName("limit")
        .setDescription("表示件数。既定は 8")
        .setMinValue(1)
        .setMaxValue(20)
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("codex-env")
    .setDescription("Discord の環境 ID と現在の allowlist 設定を確認する"),
  new SlashCommandBuilder()
    .setName("codex-generate-proposal")
    .setDescription("ゲーム企画書ドラフトを生成する")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("企画書タイトル")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("project")
        .setDescription("プロジェクト名")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("genre")
        .setDescription("ジャンル")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("platform")
        .setDescription("対象プラットフォーム")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("audience")
        .setDescription("想定ユーザー")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("core_hook")
        .setDescription("核になる面白さや売り")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("solo / co-op / multiplayer など")
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("codex-generate-issue-seeds")
    .setDescription("企画書ドラフトから GitHub Issue 下書きを生成する")
    .addStringOption((option) =>
      option
        .setName("proposal_file")
        .setDescription("drafts/proposals 配下の proposal ファイル名")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("codex-generate-spec")
    .setDescription("企画書ドラフトから spec draft を生成する")
    .addStringOption((option) =>
      option
        .setName("proposal_file")
        .setDescription("drafts/proposals 配下の proposal ファイル名")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("codex-create-issues-from-seeds")
    .setDescription("Issue 下書き Markdown から GitHub Issue を作成する")
    .addStringOption((option) =>
      option
        .setName("issue_seed_file")
        .setDescription("drafts/issue-seeds 配下の issue seed ファイル名")
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("dry_run")
        .setDescription("作成はせず確認だけ行う")
        .setRequired(false)
    ),
].map((command) => command.toJSON());

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  loadPendingConfirmations();
  pruneExpiredConfirmations();
  console.log(`Discord bot ready as ${readyClient.user.tag}`);
  console.log(`Commands defined: ${commands.map((c) => c.name).join(", ")}`);
  console.log(`Pending confirmations restored: ${pendingConfirmations.size}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const access = validateAccess(interaction);
  if (!access.allowed) {
    appendCommandLog({
      event: "access_denied",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      userId: interaction.user.id,
      channelId: interaction.channelId,
      guildId: interaction.guildId,
      failures: access.failures,
    });
    await interaction.reply({
      content: buildAccessDeniedReply(),
      ephemeral: true,
    });
    return;
  }

  if (interaction.commandName === "codex") {
    pruneExpiredConfirmations();
    const instruction = normalizeInstruction(
      interaction.options.getString("instruction", true)
    );
    appendCommandLog({
      event: "instruction_received",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
      instruction,
    });

    if (needsConfirmation(instruction)) {
      const token = createPendingConfirmation(instruction, interaction.user);
      await interaction.reply({
        content: buildConfirmationReply(token, instruction),
        ephemeral: REPLY_EPHEMERAL,
      });
      return;
    }

    await handleCodexInstruction(interaction, instruction, DEFAULT_EXEC_MODE);
    return;
  }

  if (interaction.commandName === "codex-status") {
    await interaction.deferReply({ ephemeral: REPLY_EPHEMERAL });
    appendCommandLog({
      event: "status_requested",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
    });

    try {
      const summary = await buildStatusSummary();
      appendCommandLog({
        event: "status_succeeded",
        commandName: interaction.commandName,
        userTag: interaction.user.tag,
        channelId: interaction.channelId,
      });
      await interaction.editReply(trimForDiscord(summary));
    } catch (error) {
      appendCommandLog({
        event: "status_failed",
        commandName: interaction.commandName,
        userTag: interaction.user.tag,
        channelId: interaction.channelId,
        error: error.message,
      });
      await interaction.editReply(
        trimForDiscord(
          [
            "ステータス集約でエラーが発生しました。",
            "",
            error.message,
            "",
            "fallback:",
            "```md",
            readContextPreview(),
            "```",
          ].join("\n")
        )
      );
    }
    return;
  }

  if (interaction.commandName === "codex-confirm") {
    pruneExpiredConfirmations();
    const target = interaction.options.getString("target") || "";
    const pending = pendingConfirmations.get(target);
    appendCommandLog({
      event: "confirmation_received",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
      token: target,
    });

    if (!pending) {
      appendCommandLog({
        event: "confirmation_missing",
        commandName: interaction.commandName,
        userTag: interaction.user.tag,
        channelId: interaction.channelId,
        token: target,
      });
      await interaction.reply({
        content: "確認対象が見つかりませんでした。token を確認してください。",
        ephemeral: REPLY_EPHEMERAL,
      });
      return;
    }

    if (pending.userId && pending.userId !== interaction.user.id) {
      appendCommandLog({
        event: "confirmation_rejected_user_mismatch",
        commandName: interaction.commandName,
        userTag: interaction.user.tag,
        userId: interaction.user.id,
        channelId: interaction.channelId,
        token: target,
        expectedUserId: pending.userId,
      });
      await interaction.reply({
        content: buildConfirmationRejectedReply(),
        ephemeral: true,
      });
      return;
    }

    pendingConfirmations.delete(target);
    savePendingConfirmations();
    appendCommandLog({
      event: "confirmation_accepted",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
      token: target,
      instruction: pending.instruction,
    });
    await handleCodexInstruction(interaction, pending.instruction, "workspace-write");
    return;
  }

  if (interaction.commandName === "codex-pending") {
    appendCommandLog({
      event: "pending_list_requested",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
    });
    await interaction.reply({
      content: trimForDiscord(buildPendingSummary()),
      ephemeral: REPLY_EPHEMERAL,
    });
    return;
  }

  if (interaction.commandName === "codex-sync-tasks") {
    const dryRun = interaction.options.getBoolean("dry_run") ?? true;
    if (!dryRun) {
      const applyAccess = canApplyTaskSync(interaction);
      if (!applyAccess.allowed) {
        appendCommandLog({
          event: "task_sync_apply_denied",
          commandName: interaction.commandName,
          userTag: interaction.user.tag,
          channelId: interaction.channelId,
          reason: applyAccess.reason,
        });
        await interaction.reply({
          content: buildTaskSyncApplyDeniedReply(applyAccess.reason),
          ephemeral: REPLY_EPHEMERAL,
        });
        return;
      }
    }
    await handleTaskSync(interaction, dryRun);
    return;
  }

  if (interaction.commandName === "codex-log") {
    const limit = interaction.options.getInteger("limit") ?? 8;
    appendCommandLog({
      event: "command_log_requested",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
      limit,
    });
    await interaction.reply({
      content: trimForDiscord(buildCommandLogSummary(limit)),
      ephemeral: REPLY_EPHEMERAL,
    });
    return;
  }

  if (interaction.commandName === "codex-env") {
    appendCommandLog({
      event: "environment_summary_requested",
      commandName: interaction.commandName,
      userTag: interaction.user.tag,
      channelId: interaction.channelId,
    });
    await interaction.reply({
      content: trimForDiscord(buildEnvironmentSummary(interaction)),
      ephemeral: REPLY_EPHEMERAL,
    });
    return;
  }

  if (interaction.commandName === "codex-generate-proposal") {
    await handleProposalGeneration(interaction);
    return;
  }

  if (interaction.commandName === "codex-generate-issue-seeds") {
    await handleIssueSeedGeneration(interaction);
    return;
  }

  if (interaction.commandName === "codex-generate-spec") {
    await handleSpecGeneration(interaction);
    return;
  }

  if (interaction.commandName === "codex-create-issues-from-seeds") {
    const dryRun = interaction.options.getBoolean("dry_run") ?? true;
    if (!dryRun) {
      const applyAccess = canApplyIssueCreation(interaction);
      if (!applyAccess.allowed) {
        appendCommandLog({
          event: "github_issue_creation_apply_denied",
          commandName: interaction.commandName,
          userTag: interaction.user.tag,
          channelId: interaction.channelId,
          reason: applyAccess.reason,
        });
        await interaction.reply({
          content: buildIssueCreationDeniedReply(applyAccess.reason),
          ephemeral: REPLY_EPHEMERAL,
        });
        return;
      }
    }

    await handleGithubIssueCreation(interaction, dryRun);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
