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
    .setName("codex-bootstrap-project")
    .setDescription("proposal / spec / issue seeds をまとめて生成する")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("企画タイトル")
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
    .setName("codex-apply-bootstrap")
    .setDescription("bootstrap 済みの spec と issue seeds をまとめて反映する")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("企画タイトル。最新の spec / issue seeds を自動解決する")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("spec_file")
        .setDescription("drafts/specs 配下の spec ファイル名")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("issue_seed_file")
        .setDescription("drafts/issue-seeds 配下の issue seeds ファイル名")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("dry_run")
        .setDescription("true は確認のみ、false は Notion / GitHub に反映")
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
    .setName("codex-create-spec-in-notion")
    .setDescription("spec draft から Notion Specs に page を作成する")
    .addStringOption((option) =>
      option
        .setName("spec_file")
        .setDescription("drafts/specs 配下の spec ファイル名")
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("dry_run")
        .setDescription("作成はせず確認だけ行う")
        .setRequired(false)
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
