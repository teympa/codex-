# Discord Bot Setup

## Goal

Discord から Codex に指示を送るための最小 Bot を起動する。

## Included MVP

- `/codex`
- `/codex-status`
- `/codex-confirm`
- `/codex-pending`
- `/codex-sync-tasks`
- `/codex-log`
- `/codex-env`
- `/codex-generate-proposal`
- `/codex-generate-issue-seeds`
- `/codex-create-issues-from-seeds`

## Required Environment Variables

`.env` に以下を入れる。

```env
DISCORD_BOT_TOKEN=
DISCORD_APPLICATION_ID=
DISCORD_GUILD_ID=
NOTION_API_TOKEN=
DISCORD_REPLY_EPHEMERAL=true
DISCORD_CODEX_EXEC_MODE=read-only
DISCORD_ALLOWED_GUILD_IDS=
DISCORD_ALLOWED_CHANNEL_IDS=
DISCORD_ALLOWED_USER_IDS=
DISCORD_SYNC_APPLY_CHANNEL_IDS=
DISCORD_ISSUE_APPLY_CHANNEL_IDS=
GITHUB_TOKEN=
```

`NOTION_API_TOKEN` は任意です。設定すると `/codex-status` で Notion `Tasks` の live 集計を返します。
`DISCORD_REPLY_EPHEMERAL=false` にすると、Bot の返答をチャンネル全体に表示できます。
`DISCORD_CODEX_EXEC_MODE=bypass` にすると、Discord 経由の `/codex` 実行を sandbox bypass で走らせます。
`DISCORD_ALLOWED_GUILD_IDS` `DISCORD_ALLOWED_CHANNEL_IDS` `DISCORD_ALLOWED_USER_IDS` は任意です。カンマ区切りで指定すると、その allowlist に一致する場所とユーザーだけが Bot を使えます。
`DISCORD_SYNC_APPLY_CHANNEL_IDS` は任意です。本当に Notion を更新する `dry_run:false` を許可するチャンネルだけを入れます。
`DISCORD_ISSUE_APPLY_CHANNEL_IDS` は任意です。GitHub Issue を本作成する `dry_run:false` を許可するチャンネルだけを入れます。
`GITHUB_TOKEN` は任意です。設定すると GitHub Issue 作成の本実行ができます。

## Install

```bash
npm install
```

## Register Commands

```bash
npm run register:commands
```

## Start Bot

```bash
npm run dev
```

## Current Behavior

- `/codex`: 安全な指示は `codex exec` で実行する
- `/codex-status`: `context.md`、GitHub tracked issues、任意で Notion `Tasks` 集計を返す
- `/codex-confirm`: 確認待ちトークンを受けて変更系指示を実行する
- `/codex-pending`: 確認待ちの token 一覧を確認する
- `/codex-sync-tasks`: GitHub Issue と Notion `Tasks` の同期を実行する
- `/codex-log`: 実行ログの最新数件を確認する
- `/codex-env`: 現在の guild / channel / user ID と allowlist 設定を確認する
- `/codex-generate-proposal`: ゲーム企画書ドラフトを生成する
- `/codex-generate-issue-seeds`: 企画書ドラフトから GitHub Issue 下書きを生成する
- `/codex-create-issues-from-seeds`: Issue 下書きから GitHub Issue を作成する
- 確認待ちトークンは `runtime/pending-confirmations.json` に保存する
- Bot 再起動後も 24 時間以内の確認待ちは復元する
- `/codex-sync-tasks` の `dry_run:false` は `DISCORD_SYNC_APPLY_CHANNEL_IDS` のチャンネルでだけ許可する
- `/codex-create-issues-from-seeds` の `dry_run:false` は `DISCORD_ISSUE_APPLY_CHANNEL_IDS` のチャンネルでだけ許可する

## Logging

- 実行ログは `runtime/discord-command-log.jsonl` に保存する
- 1 行 1 JSON の形式で、受信、確認待ち、成功、失敗を記録する
- 標準出力と標準エラーは既存どおり `runtime/discord-bot.out.log` と `runtime/discord-bot.err.log`
- 確認待ち状態は `runtime/pending-confirmations.json` に保存する

## Visibility

- 既定値では Bot の返答は `ephemeral` です
- 全体表示にしたい場合は `.env` で `DISCORD_REPLY_EPHEMERAL=false`
- ただし `/codex-confirm` の token や作業内容も見えるようになるので注意

## Access Control

- `DISCORD_ALLOWED_GUILD_IDS` を設定すると、指定した guild 以外では実行できません
- `DISCORD_ALLOWED_CHANNEL_IDS` を設定すると、指定した channel 以外では実行できません
- `DISCORD_ALLOWED_USER_IDS` を設定すると、指定した user 以外では実行できません
- `DISCORD_SYNC_APPLY_CHANNEL_IDS` を設定すると、`/codex-sync-tasks dry_run:false` の本実行チャンネルを限定できます
- `DISCORD_ISSUE_APPLY_CHANNEL_IDS` を設定すると、`/codex-create-issues-from-seeds dry_run:false` の本実行チャンネルを限定できます
- 複数指定する場合は `123,456,789` のようにカンマ区切りで入れます
- 拒否された操作は `runtime/discord-command-log.jsonl` に `access_denied` として残ります

## Confirmation Behavior

- 読み取り系や要約系の指示はそのまま `codex exec` に流す
- `write` `edit` `update` `commit` `push` などを含む指示は確認待ちにする
- 確認待ちになったら `/codex-confirm target:<token>` で続行する
- 確認待ち token は発行された本人だけが承認できる
- 24 時間を過ぎた確認待ちは自動的に破棄する

## Sandbox Note

- Windows 環境によっては `read-only` sandbox で `CreateProcessAsUserW failed: 5` が起きることがあります
- その場合は `.env` で `DISCORD_CODEX_EXEC_MODE=bypass` を使うと回避できます
- ただし bypass は強い権限で実行されるため、`DISCORD_ALLOWED_CHANNEL_IDS` と `DISCORD_ALLOWED_USER_IDS` で絞るのがおすすめです

## Next Implementation Steps

1. 実行ログを分析しやすい形に整える
2. Notion / GitHub 連携を安全に有効化する
3. 許可ユーザー向けに `/codex-status` の要約粒度を改善する
4. allowlist の実運用値を `.env` に反映する
