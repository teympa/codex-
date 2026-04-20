# Discord Bot Setup

## Goal

Discord から Codex に指示を送るための最小 Bot を起動する。

## Included MVP

- `/codex`
- `/codex-status`
- `/codex-confirm`

## Required Environment Variables

`.env` に以下を入れる。

```env
DISCORD_BOT_TOKEN=
DISCORD_APPLICATION_ID=
DISCORD_GUILD_ID=
```

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

- `/codex`: 指示受付の確認を返す
- `/codex-status`: `context.md` の先頭を返す
- `/codex-confirm`: confirm の受付確認を返す

## Next Implementation Steps

1. `/codex` を Codex 実行ランナーへつなぐ
2. 実行ログを保持する
3. 確認待ちアクションの状態管理を追加する
4. Notion / GitHub 連携を安全に有効化する
