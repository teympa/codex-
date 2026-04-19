# GitHub Issue And PR Playbook

## Goal

Codex を使った日常開発で、Issue 起票から PR マージまでの流れをぶれずに回せるようにする。

## Issue Workflow

1. 作業を Issue 単位に分解する
2. `Background` `Goal` `Done Criteria` を埋める
3. Type label と Priority label を付ける
4. 着手可能なら `status:ready` を付ける
5. 実装中は必要に応じてメモを追記する
6. 完了条件を満たしたら PR を作る

## Pull Request Workflow

1. 関連 Issue を明記する
2. `Summary` `Why` `How To Verify` を埋める
3. 影響範囲を短く書く
4. レビュー待ちなら `status:review` を付ける
5. マージ後は関連 Issue と Notion 側の状態を更新する

## Done Criteria Guidance

完了条件は以下のように書く。

- 実装対象が具体的に分かる
- 確認方法が分かる
- 完了と未完了の境界が明確

悪い例:

- なんとなく整える
- 必要なら修正する

良い例:

- `docs/github-workflow.md` にラベル方針が反映されている
- PR template が配置されている
- 5つの Phase 1 Issue が起票されている

## PR Review Focus

PR では以下を見る。

- Done Criteria を満たしているか
- 影響範囲に漏れがないか
- ドキュメント更新が必要なら含まれているか
- 次の運用に必要な情報が残っているか

## Notion Sync Reminder

- Issue を作ったら Notion `Tasks` への反映対象か確認する
- 設計判断が増えたら Notion `Specs` または `Notes` にも残す

## Minimum Operating Rules

- Issue を作らずに大きな変更を始めない
- PR に確認方法がない状態でレビューへ出さない
- 迷った判断は GitHub だけで閉じず、Notion か `context.md` に要約する
