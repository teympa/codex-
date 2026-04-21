# Codex Workspace

Codex を中核にした運用基盤を整備するためのワークスペースです。

このリポジトリでは、Notion を情報ハブにしつつ、GitHub を実装と変更履歴の正本として運用し、`context.md` で次回起動用の短期コンテキストを管理します。あわせて、Phase 2 で使う Discord 指示窓口の MVP も先行して置いています。

## Current Phase

現在は Phase 1 を進行中です。

- Notion 基盤の整備
- GitHub 運用の整備
- 正本ルールの固定
- GitHub と Notion の同期運用ルールの固定
- Phase 2 の Discord Bot MVP を先行実装

## Source Of Truth

- 長期で人が読む情報の正本: Notion
- 実装と変更履歴の正本: GitHub
- 次回起動用の短期文脈の正本: `context.md`

詳細:

- `docs/source-of-truth-policy.md`
- `docs/github-notion-sync-policy.md`

## Repository Scope

- Notion を情報ハブにした仕様書、メモ、進行管理
- GitHub を中心にした Issue / PR 運用
- `context.md` を使った短期コンテキスト管理
- Discord、Google サービス、ComfyUI、Web ダッシュボード連携の準備

## Key Files

- `context.md`
- `codex-roadmap.md`
- `docs/notion-schema.md`
- `docs/notion-build-guide.md`
- `docs/github-workflow.md`
- `docs/github-notion-sync-policy.md`
- `docs/source-of-truth-policy.md`
- `docs/discord-ops-design.md`
- `docs/discord-bot-setup.md`

## Working Rules

- 大きな作業は先に GitHub Issue 単位へ分解する
- 設計判断は必要に応じて Notion `Specs` または `Notes` に残す
- `context.md` には次回の入口になる短い情報だけ残す
- GitHub と Notion を同じ粒度で二重更新しない
- GitHub と Notion の同期は `Tasks` を中心に最小限で行う

## Notion Setup

親ページ:

- `Codex`

主要 DB:

- `Projects`
- `Tasks`
- `Specs`
- `Notes`
- `Knowledge`

`Tasks` は GitHub Issue 同期の主対象です。

## GitHub Setup

主要 Issue:

- `#1` Notion DB 初期設計
- `#2` GitHub 運用テンプレート整備
- `#3` `context.md` 運用開始
- `#4` 正本ルール確定
- `#5` Phase 1 の追跡開始

## Discord MVP

Node.js 20 以上で、最小の Discord Bot を起動できます。

含まれるコマンド:

- `/codex`
- `/codex-status`
- `/codex-confirm`
- `/codex-pending`

セットアップ:

```powershell
npm install
Copy-Item .env.example .env
```

`.env` に以下を設定します。

```env
DISCORD_BOT_TOKEN=
DISCORD_APPLICATION_ID=
DISCORD_GUILD_ID=
DISCORD_ALLOWED_GUILD_IDS=
DISCORD_ALLOWED_CHANNEL_IDS=
DISCORD_ALLOWED_USER_IDS=
```

`DISCORD_ALLOWED_*` は任意ですが、`DISCORD_CODEX_EXEC_MODE=bypass` で使う場合は設定推奨です。
確認待ちトークンは `runtime/pending-confirmations.json` に保存され、Bot 再起動後も引き継がれます。

コマンド登録:

```bash
npm run register:commands
```

起動:

```bash
npm run dev
```

詳細:

- `docs/discord-bot-setup.md`
- `docs/discord-ops-design.md`
- `codex-roadmap.md`

## Session Checklist

作業開始時:

1. `context.md` を読む
2. 関連 Issue を確認する
3. 正本がどこかを確認する

作業終了時:

1. 必要なら Notion / GitHub の状態をそろえる
2. `context.md` の `Immediate Next Steps` を更新する
3. `context.md` の `Handoff` を更新する

## Next Likely Work

- GitHub / Notion `Tasks` 同期の半自動化
- `/codex-status` の要約改善
- 管理用 Discord コマンドの追加
- Notion 運用テンプレートの強化

## Task Sync

GitHub Issue から Notion `Tasks` への最小同期を回せます。

```bash
npm run sync:tasks:dry
npm run sync:tasks
```

詳細:

- `docs/github-notion-sync-policy.md`
