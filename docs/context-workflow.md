# Context Workflow

## Goal

`context.md` を Codex の短期運用コンテキストとして継続的に更新し、次回起動時の文脈復元コストを下げる。

## What Context.md Is For

`context.md` には以下だけを残す。

- 今の目的
- 完了済みと未完了の実務状態
- 次に着手すべき 1 件
- 次にやること
- 重要な判断
- 参照すべきローカル文書

長期保存向きの情報は Notion に寄せる。

## When To Update

以下のタイミングで更新する。

1. 新しい Phase や Issue に着手したとき
2. 設計判断をしたとき
3. 次の作業者が迷いそうな変更をしたとき
4. 作業を終える直前

## Minimum Update Rules

毎回少なくとも以下を見直す。

- `Current Focus`
- `Execution Status`
- `Active Deliverables`
- `Immediate Next Steps`
- `Decision Log`
- `Handoff`

## Writing Rules

- 長文ではなく要点だけを書く
- `Completed Items / Incomplete Items / Next Priority` で現状を切り分ける
- `Next Priority` は 1 件に絞る
- `Immediate Next Steps` は実行順が分かる表現にする
- 履歴は `Decision Log` に短く残す
- 参照先がある場合はローカル文書名を明記する

## Suggested Session Flow

1. 作業開始時に `Current Focus` を確認する
2. `Execution Status` で完了済み、未完了、次の 1 件を整理する
3. その日の主対象を `Immediate Next Steps` の先頭に寄せる
4. 設計判断が出たら `Decision Log` に追記する
5. 作業終了時に `Handoff` を更新する

## Anti-Patterns

避けること:

- 会話ログをそのまま書く
- 完了した詳細タスクを大量に残す
- `Next Priority` に複数案件を並べる
- Notion と二重管理する
- 曖昧な文だけ残して次アクションを書かない

## Done Check For Issue #3

- `context.md` の役割が明文化されている
- 更新タイミングが決まっている
- セッション終了時に何を直すか決まっている
- 次回起動時の入口として使える
