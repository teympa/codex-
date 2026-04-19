# Phase 1 Backlog

Phase 1 を GitHub 上で追跡開始するためのバックログ一覧。

## Goal

Phase 1 の各項目を優先順、状態、依存関係つきで管理し、次に着手する Issue を迷わず選べる状態にする。

## Backlog Table

| ID | Title | Priority | Initial Status | Depends On | Notes |
| --- | --- | --- | --- | --- | --- |
| P1-01 | Notion DB 初期設計を確定する | High | Ready | - | Notion の基盤設計 |
| P1-02 | GitHub の Issue / PR 運用テンプレートを整備する | High | Ready | - | GitHub 運用の基盤 |
| P1-03 | `context.md` の運用を開始する | High | Ready | - | Codex の引き継ぎ基盤 |
| P1-04 | Notion / GitHub / `context.md` の正本ルールを確定する | High | Planned | P1-01, P1-02, P1-03 | 情報の責務分担を固定 |
| P1-05 | Phase 1 タスクを GitHub で追跡開始する | Medium | In Progress | P1-01, P1-02, P1-03 | 起票と追跡開始 |

## Recommended Active Order

1. P1-01
2. P1-02
3. P1-03
4. P1-04
5. P1-05

## Current Recommendation

現時点のアクティブ候補:

- `P1-03`: `context.md` の運用を開始する

理由:

- ローカルではすでに初版がある
- 今後の全作業に共通で効く
- GitHub 起票後も更新サイクルに乗せやすい

## Status Definition

- `Ready`: 今すぐ着手できる
- `Planned`: 前提はあるが、先行タスク完了後が望ましい
- `In Progress`: 進行中
- `Blocked`: 外部要因や判断待ち
- `Done`: 完了

## GitHub Setup Checklist

- [ ] Phase 1 Issue を 5 件起票する
- [ ] 各 Issue に Type label を付ける
- [ ] 各 Issue に Priority label を付ける
- [ ] 着手可能な Issue に `status:ready` を付ける
- [ ] 最初のアクティブ Issue を 1 件決める
- [ ] Notion `Tasks` へ反映対象を確認する

## After Creation

起票後の最初の運用:

1. `P1-03` をアクティブにする
2. `P1-01` と `P1-02` は Ready のまま保持する
3. `P1-04` は先行 3 件の内容を受けて着手する
4. Phase 1 完了後に Discord 設計へ進む
