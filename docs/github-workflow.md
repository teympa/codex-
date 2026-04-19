# GitHub Workflow

## Goal

GitHub を開発実行の中心にして、Issue、PR、ブランチ、レビューの流れを Codex と連携しやすい形に整える。

## Repository Structure

初期方針:

- 1プロジェクト1リポジトリを基本とする
- 共通運用ドキュメントは各リポジトリの `docs/` に置く
- 横断ナレッジは Notion に集約する

## Branch Strategy

推奨命名規則:

- `main`: 安定版
- `feat/<topic>`
- `fix/<topic>`
- `docs/<topic>`
- `chore/<topic>`

## Issue Types

最低限のラベル候補:

- `feature`
- `bug`
- `docs`
- `design`
- `research`
- `automation`
- `priority:high`
- `priority:medium`
- `priority:low`
- `status:blocked`
- `status:ready`
- `status:review`

## Issue Template Policy

Issue には以下を含める。

- 背景
- 目的
- 完了条件
- 実装メモ
- 関連資料

運用ルール:

- Type label を1つ付ける
- Priority label を1つ付ける
- 着手可能なら `status:ready` を付ける

## Pull Request Policy

PR には以下を含める。

- 何を変えたか
- なぜ必要か
- 確認方法
- 影響範囲
- 関連 Issue

運用ルール:

- PR を出す時点で Done Criteria を満たしていること
- レビュー待ちでは `status:review` を付ける
- マージ後に関連 Issue と Notion 状態を更新する

## Notion Sync Policy

- Issue 作成時に Notion `Tasks` に同名レコードを作る
- Issue の状態変更時に Notion `Status` を更新する
- PR 作成時は Notion 上のステータスを `Review` にする
- PR マージ時は Notion 上のステータスを `Done` にする

補足:

- 実行状態の正本は GitHub に置く
- Notion 側は一覧性と人間向け集約を主目的にする
- 詳細な同期手順は `docs/github-notion-sync-policy.md` を参照する

## Codex Working Rules

- 大きな作業は先に Issue 単位へ分解する
- 実装前に完了条件を Issue に明記する
- 仕様変更が出たら Issue だけで閉じず、Notion の `Specs` か `Notes` に判断を残す
- 自動化対象は `automation` ラベルを付ける

## First Issues To Create

1. Notion DB 初期設計
2. GitHub テンプレート整備
3. `context.md` 初版整備
4. Discord Bot 最小設計
5. GitHub-Notion 同期 PoC

## Related Documents

- `docs/github-labels.md`
- `docs/github-issue-pr-playbook.md`
- `docs/github-notion-sync-policy.md`
- `docs/source-of-truth-policy.md`
- `.github/ISSUE_TEMPLATE/task.md`
- `.github/pull_request_template.md`

## Suggested Templates

### Issue Template

```md
## Background

## Goal

## Done Criteria

## Notes

## References
```

### Pull Request Template

```md
## Summary

## Why

## How To Verify

## Impact

## Related Issues
```

## Open Questions

- GitHub Actions でどこまで同期を自動化するか
- 個人運用と将来のチーム運用でルールを共通化するか
- 開発日報の自動生成先を GitHub に寄せるか Notion に寄せるか
