# GitHub Notion Sync Policy

## Goal

GitHub と Notion の役割を崩さずに、必要な情報だけを同期して運用コストを下げる。

## Core Principle

- 実行状態の正本は GitHub
- 人間向けの集約と横断把握は Notion
- 両方を同じ粒度で手更新しない

## What Syncs

同期対象の中心は `Tasks` DB。

GitHub から Notion に反映するもの:

- Issue タイトル
- Issue 番号
- Issue URL
- 優先度
- 実行状態
- 担当
- 主要カテゴリ

Notion にのみ残すもの:

- 横断一覧で見たい補足情報
- Project との relation
- 人間向けの整理用ビュー

## Task Mapping

### GitHub Issue -> Notion Tasks

- Issue Title -> `Task`
- Issue Number -> `GitHub Issue Number`
- Issue URL -> `GitHub Issue URL`
- Labels -> `Priority` `Category` `Source`
- State / progress -> `Status`

### Recommended Status Mapping

- GitHub newly created -> Notion `Inbox` または `Planned`
- GitHub actively being worked -> Notion `In Progress`
- PR open / review pending -> Notion `Review`
- Blocked in GitHub -> Notion `Blocked`
- Closed / completed -> Notion `Done`

## Sync Triggers

### 1. Issue Created

やること:

- Notion `Tasks` にレコードを作る
- `GitHub Issue Number` と `GitHub Issue URL` を入れる
- `Source` は `GitHub`
- 必要なら `Project` relation を手でつなぐ

### 2. Issue Updated

やること:

- ラベル変更が優先度やカテゴリに影響する場合だけ Notion を更新する
- 細かな会話履歴までは Notion に移さない

### 3. Work Started

やること:

- GitHub 側で着手状態を明確にする
- Notion `Status` を `In Progress` にする

### 4. Pull Request Opened

やること:

- Notion `Status` を `Review` にする
- 必要なら関連 `Specs` や `Notes` に判断を残す

### 5. Work Completed

やること:

- GitHub Issue が完了したら Notion `Status` を `Done` にする
- 再利用価値がある判断は `Knowledge` または `Specs` に昇格する

## Manual vs Automatic Sync

初期方針:

- まずは手動または半手動で同期する
- 自動化はルールが固まってから入れる

自動化候補:

- GitHub Issue 作成時に Notion `Tasks` を追加
- GitHub Issue close 時に Notion `Done` 更新
- PR 作成時に Notion `Review` 更新

## What Not To Sync

同期しないもの:

- Issue コメント全文
- PR コメント全文
- コミットの細かな履歴
- 一時的な調査ログ全文

これらは GitHub を正本として保持し、必要な要点だけ Notion に要約する。

## Daily Operating Rule

1. 作業開始前に GitHub Issue を確認する
2. 必要なら Notion `Tasks` の `Status` を合わせる
3. 仕様変更があれば `Specs` または `Notes` へ要点を残す
4. 完了時に GitHub と Notion の状態をそろえる
5. 次回の入口だけ `context.md` に残す

## Exceptions

- GitHub を使わない個人メモは `Notes` のみでよい
- 長期知見は `Knowledge` を正本にする
- 実装が絡まない企画整理は Notion 側中心でよい

## Minimal Stable Workflow

最小構成では次だけ守る。

- GitHub Issue を作ったら Notion `Tasks` を作る
- GitHub で着手したら Notion `In Progress`
- GitHub で完了したら Notion `Done`
- 仕様判断は Notion に残す
