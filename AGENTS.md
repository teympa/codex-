# AGENTS

## Purpose

このリポジトリは、Codex を中核にした運用基盤を整備するためのワークスペースです。

主な対象:

- Notion を情報ハブにした仕様書、メモ、進行管理
- GitHub を中心にした Issue / PR 運用
- `context.md` を使った短期コンテキスト管理
- Discord、Google サービス、ComfyUI、Web ダッシュボード連携の準備

## Current Phase

現在は Phase 1 を進行中です。

- Notion 基盤の整備
- GitHub 運用の整備
- 正本ルールの固定
- GitHub と Notion の同期運用ルールの固定

## Source Of Truth

- 長期で人が読む情報の正本: Notion
- 実装と変更履歴の正本: GitHub
- 次回起動用の短期文脈の正本: `context.md`

詳細:

- `docs/source-of-truth-policy.md`
- `docs/github-notion-sync-policy.md`

## Key Files

- `context.md`
- `codex-roadmap.md`
- `docs/notion-schema.md`
- `docs/notion-build-guide.md`
- `docs/github-workflow.md`
- `docs/github-notion-sync-policy.md`
- `docs/source-of-truth-policy.md`

## Working Rules

- 大きな作業は先に GitHub Issue 単位へ分解する
- 設計判断は必要に応じて Notion `Specs` または `Notes` に残す
- `context.md` には次回の入口になる短い情報だけ残す
- GitHub と Notion を同じ粒度で二重更新しない
- GitHub と Notion の同期は `Tasks` を中心に最小限で行う

## Notion Setup

親ページ:

- `Codex` Notion page

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

## Session Checklist

作業開始時:

1. `context.md` を読む
2. 関連 Issue を確認する
3. 正本がどこかを確認する

作業終了時:

1. 必要なら Notion / GitHub の状態をそろえる
2. `context.md` の `Immediate Next Steps` を更新する
3. `context.md` の `Handoff` を更新する

## Commit Guidance

- ドキュメント整備は目的ごとに小さくコミットする
- コミットメッセージは要点が分かる英語短文でよい
- push 前に `git status --short` で差分を確認する

## Next Likely Work

- Phase 2 の Discord 操作設計
- GitHub / Notion 同期の半自動化
- Notion 運用テンプレートの強化
