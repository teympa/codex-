# Notion Build Guide

## Goal

`docs/notion-schema.md` をもとに、Notion 上で `Projects` `Tasks` `Specs` `Notes` `Knowledge` の 5 DB を迷わず構築できる状態にする。

## Build Order

以下の順で作る。

1. `Projects`
2. `Tasks`
3. `Specs`
4. `Notes`
5. `Knowledge`

この順にすると、relation の接続先が先に存在するため作業が楽になる。

## Database Setup

### 1. Projects

最初に作る親DB。

プロパティ:

- `Name`: Title
- `Type`: Select
- `Status`: Select
- `Priority`: Select
- `Owner`: Text
- `Repository`: URL
- `Summary`: Text
- `Start Date`: Date
- `Target Date`: Date
- `Tags`: Multi-select

推奨 Select 候補:

- `Type`: `Game`, `Tool`, `Article`, `Research`, `Ops`
- `Status`: `Idea`, `Planned`, `Active`, `Paused`, `Done`
- `Priority`: `High`, `Medium`, `Low`

### 2. Tasks

GitHub Issue と連動しやすい進行管理DB。

プロパティ:

- `Task`: Title
- `Project`: Relation -> Projects
- `Status`: Select
- `Priority`: Select
- `Assignee`: Text
- `Due Date`: Date
- `GitHub Issue Number`: Number
- `GitHub Issue URL`: URL
- `Category`: Select
- `Estimate`: Number
- `Source`: Select

推奨 Select 候補:

- `Status`: `Inbox`, `Planned`, `In Progress`, `Review`, `Blocked`, `Done`
- `Priority`: `High`, `Medium`, `Low`
- `Category`: `Planning`, `Implementation`, `Docs`, `Research`, `Ops`
- `Source`: `Manual`, `GitHub`, `Discord`, `Automation`

### 3. Specs

仕様書と企画書を整理するDB。

プロパティ:

- `Title`: Title
- `Project`: Relation -> Projects
- `Spec Type`: Select
- `Status`: Select
- `Version`: Text
- `Last Reviewed`: Date
- `Source`: Select
- `GitHub Issue`: URL
- `Tags`: Multi-select

推奨 Select 候補:

- `Spec Type`: `Game Design`, `Technical Design`, `Feature Spec`, `System Spec`, `Article Outline`
- `Status`: `Draft`, `Reviewing`, `Approved`, `Archived`
- `Source`: `Manual`, `GitHub`, `Discord`, `Automation`

### 4. Notes

調査、メモ、アイデア断片を保存するDB。

プロパティ:

- `Title`: Title
- `Project`: Relation -> Projects
- `Note Type`: Select
- `Status`: Select
- `Source`: Select
- `Created By`: Text
- `Needs Action`: Checkbox
- `Linked Task`: Relation -> Tasks
- `Tags`: Multi-select

推奨 Select 候補:

- `Note Type`: `Idea`, `Research`, `Meeting`, `Log`, `Reference`
- `Status`: `Open`, `Reviewed`, `Archived`
- `Source`: `Manual`, `Discord`, `Web`, `Automation`

### 5. Knowledge

再利用したい知識や業界情報をまとめるDB。

プロパティ:

- `Title`: Title
- `Domain`: Select
- `Topic`: Multi-select
- `Source Link`: URL
- `Related Project`: Relation -> Projects
- `Reviewed On`: Date
- `Use Case`: Text
- `Public Candidate`: Checkbox

推奨 Select 候補:

- `Domain`: `Game Design`, `Game Business`, `Marketing`, `Production`, `Tech`, `AI`

## Relation Design

最低限の relation は以下。

- `Tasks.Project` -> `Projects`
- `Specs.Project` -> `Projects`
- `Notes.Project` -> `Projects`
- `Notes.Linked Task` -> `Tasks`
- `Knowledge.Related Project` -> `Projects`

必要以上に relation を張りすぎず、まずは参照頻度の高いものだけに絞る。

## Recommended Views

### Projects

- `Active Projects`: `Status = Active`
- `Planned Projects`: `Status = Planned`

### Tasks

- `Inbox`: `Status = Inbox`
- `Current`: `Status = Planned or In Progress`
- `Blocked`: `Status = Blocked`
- `Done This Week`: 最近更新された `Done`

### Specs

- `Drafts`: `Status = Draft`
- `Review Queue`: `Status = Reviewing`

### Notes

- `Needs Action`: `Needs Action = checked`
- `Recent Notes`: 作成日降順

### Knowledge

- `Public Candidates`: `Public Candidate = checked`
- `By Domain`: `Domain` ごと

## Initial Seed Data

最初に最低限入れる。

### Projects

- `Codex Ops`
- `Game Project Alpha`
- `Industry Research`

### Tasks

- `Notion DB 初期設計を確定する`
- `GitHub 運用テンプレートを整備する`
- `Discord Bot 最小設計を作る`

### Specs

- `Codex運用設計`
- `ゲーム企画書テンプレート`

## Build Checklist

- [ ] `Projects` を作成
- [ ] `Tasks` を作成
- [ ] `Specs` を作成
- [ ] `Notes` を作成
- [ ] `Knowledge` を作成
- [ ] relation を接続
- [ ] 各 DB に最低1つの view を作成
- [ ] 各 DB にテンプレートを登録
- [ ] 初期 seed data を登録

## Done Definition For P1-01

- 5つの DB が作成されている
- relation が接続されている
- Select 候補が登録されている
- テンプレート本文が作成されている
- 最低限の初期データが入っている
