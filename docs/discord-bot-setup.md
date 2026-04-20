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

- `/codex`: 安全な指示は `codex exec` で実行する
- `/codex-status`: `context.md` の先頭を返す
- `/codex-confirm`: 確認待ちトークンを受けて変更系指示を実行する

## Confirmation Behavior

- 読み取り系や要約系の指示はそのまま `codex exec` に流す
- `write` `edit` `update` `commit` `push` などを含む指示は確認待ちにする
- 確認待ちになったら `/codex-confirm target:<token>` で続行する

## Next Implementation Steps

1. `/codex` を Codex 実行ランナーへつなぐ
2. 実行ログを保持する
3. 確認待ちアクションの永続化を追加する
4. Notion / GitHub 連携を安全に有効化する
