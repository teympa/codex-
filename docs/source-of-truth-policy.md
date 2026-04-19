# Source Of Truth Policy

## Goal

Notion、GitHub、`context.md` の責務を分け、情報の二重管理と更新漏れを防ぐ。

## Core Rule

1つの情報には、必ず「主な正本」を1つだけ決める。

補助的に他の場所へ要約や参照を置くことはあっても、詳細更新の本体は1つに寄せる。

## Source Ownership

### Notion

Notion は、人間が読むための情報ハブと長期ナレッジの正本にする。

主に置くもの:

- 仕様書
- 企画書
- 進行管理の一覧ビュー
- 再利用したいメモや知識
- 業界調査や販売知識

向いている理由:

- ページ単位で整理しやすい
- relation と view で一覧性を持てる
- 人があとから参照しやすい

### GitHub

GitHub は、開発作業の実行履歴と変更履歴の正本にする。

主に置くもの:

- Issue
- Pull Request
- コード
- コードに近い技術文書
- 実装の完了条件とレビュー履歴

向いている理由:

- 実装作業のトラッキングに強い
- 変更差分が明確
- PR と commit で判断履歴を追いやすい

### context.md

`context.md` は、Codex の短期運用コンテキストの正本にする。

主に置くもの:

- 今の目的
- 直近の優先事項
- 次にやること
- セッションをまたぐ引き継ぎ
- 重要判断の短い要約

向いている理由:

- 次回起動時の入口として使いやすい
- 長期保存ではなく短期の文脈保持に特化できる

## Decision Matrix

### 仕様や企画の本文

- 正本: Notion
- GitHub: 関連 Issue / PR へのリンクを置く
- `context.md`: 今回関係する場合だけ短く触れる

### 実装タスクの進行

- 正本: GitHub Issue
- Notion: 一覧表示や補助管理に使う
- `context.md`: 今セッションで扱う分だけ記載する

### 長期的に再利用したい知見

- 正本: Notion
- GitHub: 必要なら関連実装へのリンクを置く
- `context.md`: 残さないか、必要最小限にする

### 次回起動時に必要な文脈

- 正本: `context.md`
- Notion: 必要なら要約元の本文を保持する
- GitHub: 関連 Issue / PR を参照先として持つ

### コード変更の根拠

- 正本: GitHub PR / commit / Issue
- Notion: 人間向けに重要判断だけ要約してよい
- `context.md`: 今のセッションで必要な短い要約だけ残す

## Update Priority

更新時は以下の順で考える。

1. この情報の正本はどこか決める
2. 正本を更新する
3. 必要なら他の場所へ要約を書く
4. `context.md` には次回の入口だけ残す

## Boundary Rules

迷いやすいケースのルール:

- 仕様変更を伴う実装:
  - 仕様本文は Notion
  - 実装タスクと差分は GitHub
  - 今回の要点だけ `context.md`

- 調査してすぐ使うメモ:
  - 短命なら `context.md` か GitHub Issue コメント
  - 再利用価値が出たら Notion に昇格

- GitHub Issue の一覧を Notion にも持つ:
  - 実行状態の正本は GitHub
  - Notion は閲覧・集約用途にとどめる

## Anti-Patterns

避けること:

- 同じ仕様本文を Notion と GitHub 両方で更新する
- `context.md` に長期ナレッジを溜める
- GitHub Issue と Notion Task の両方を手で細かく更新する
- 正本を決めずにとりあえず複数箇所へ書く

## Rule Summary

- 人間向け長期情報は Notion
- 実装と履歴は GitHub
- 次回起動用の短期文脈は `context.md`
