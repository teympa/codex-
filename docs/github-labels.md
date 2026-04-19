# GitHub Labels

## Goal

GitHub Issue と PR を最小構成で安定運用するためのラベル設計を定義する。

## Label Principles

- 最初は少数精鋭にする
- 種別、優先度、状態の3軸を中心にする
- 後から増やせるように意味を明確にしておく

## Recommended Labels

### Type Labels

- `feature`: 新機能追加
- `bug`: 不具合修正
- `docs`: ドキュメント更新
- `design`: 設計作業
- `research`: 調査や比較検討
- `automation`: 自動化や運用改善

### Priority Labels

- `priority:high`: 早めに着手すべき
- `priority:medium`: 通常優先度
- `priority:low`: 後回し可能

### Status Labels

- `status:blocked`: 外部要因や判断待ちで停止中
- `status:ready`: 着手可能
- `status:review`: レビュー待ち

## Usage Rules

- Type label は原則1つ付ける
- Priority label は原則1つ付ける
- Status label は必要なときだけ付ける
- ステータス変化は Issue 本文よりラベル優先で見える化する

## Initial Rollout

最初に作るラベル:

1. `feature`
2. `bug`
3. `docs`
4. `design`
5. `research`
6. `automation`
7. `priority:high`
8. `priority:medium`
9. `priority:low`
10. `status:blocked`
11. `status:ready`
12. `status:review`

## Notes

- ラベル色は後から変更してよい
- まずは意味の統一を優先する
