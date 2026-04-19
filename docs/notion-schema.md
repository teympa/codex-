# Notion Schema

## Goal

Notion をこのプロジェクト群の情報ハブとして使い、仕様、メモ、進行管理、ナレッジを一元化する。

## Design Principles

- 人が後から見ても追えることを優先する
- DB を増やしすぎず、用途が明確な単位に分ける
- GitHub の作業状態と接続しやすいプロパティを持たせる
- 将来的な Discord 入力と自動同期を前提にする

## Core Databases

### 1. Projects

ゲーム、ツール、記事企画などの最上位単位を管理する。

推奨プロパティ:

- `Name`: Title
- `Type`: Select
- `Status`: Select
- `Priority`: Select
- `Owner`: Person or Text
- `Repository`: URL
- `Summary`: Text
- `Start Date`: Date
- `Target Date`: Date
- `Tags`: Multi-select

### 2. Specs

仕様書、設計書、企画書を管理する。

推奨プロパティ:

- `Title`: Title
- `Project`: Relation -> Projects
- `Spec Type`: Select
- `Status`: Select
- `Version`: Text
- `Last Reviewed`: Date
- `Source`: Select
- `GitHub Issue`: URL
- `Tags`: Multi-select

### 3. Tasks

日々の進行管理と GitHub Issue 同期の受け皿にする。

推奨プロパティ:

- `Task`: Title
- `Project`: Relation -> Projects
- `Status`: Select
- `Priority`: Select
- `Assignee`: Person or Text
- `Due Date`: Date
- `GitHub Issue Number`: Number
- `GitHub Issue URL`: URL
- `Category`: Select
- `Estimate`: Number
- `Source`: Select

ステータス候補:

- `Inbox`
- `Planned`
- `In Progress`
- `Review`
- `Blocked`
- `Done`

### 4. Notes

メモ、調査、ブレスト、アイデア断片を集約する。

推奨プロパティ:

- `Title`: Title
- `Project`: Relation -> Projects
- `Note Type`: Select
- `Status`: Select
- `Source`: Select
- `Created By`: Text
- `Needs Action`: Checkbox
- `Linked Task`: Relation -> Tasks
- `Tags`: Multi-select

### 5. Knowledge

再利用したい知見、販売知識、開発知識、業界情報を蓄積する。

推奨プロパティ:

- `Title`: Title
- `Domain`: Select
- `Topic`: Multi-select
- `Source Link`: URL
- `Related Project`: Relation -> Projects
- `Reviewed On`: Date
- `Use Case`: Text
- `Public Candidate`: Checkbox

## Recommended Templates

### Project Template

含める項目:

- 概要
- 目的
- 主要リンク
- 進行状況
- 関連仕様
- 関連タスク
- 決定事項

### Spec Template

含める項目:

- 背景
- 目的
- 要件
- 画面/機能一覧
- 非機能要件
- 未決事項
- 変更履歴

### Task Template

含める項目:

- 目的
- 完了条件
- 関連リンク
- 実装メモ
- レビュー観点

### Note Template

含める項目:

- 要点
- 元情報
- 次アクション
- 関連プロジェクト

## Sync Policy

- GitHub Issue と同期するのは `Tasks`
- PR に紐づく設計判断は `Specs` または `Notes` に残す
- 一時メモから再利用価値が出た内容は `Knowledge` に昇格する

補足:

- `Tasks` の実行状態の正本は GitHub に置く
- Notion は一覧性、人間向け参照、横断把握を優先する
- 長期的に残したい仕様本文は Notion を正本にする

## Minimal Build Order

1. `Projects`
2. `Tasks`
3. `Specs`
4. `Notes`
5. `Knowledge`

## Open Questions

- Notion を完全な正本にする範囲をどこまで広げるか
- 家計簿やスケジュールを Notion に持つか、Google 系に分けるか
- Discord からの入力を直接 DB に書くか、一旦 Inbox に溜めるか
