# Phase 1 GitHub Issues

このファイルは、Phase 1 の作業をそのまま GitHub Issue に起票できる形でまとめたものです。

## Issue 1

### Title

`[P1-01] Notion DB 初期設計を確定する`

### Suggested Labels

- `design`
- `docs`
- `priority:high`

### Body

```md
## Background

Notion を情報ハブとして使う前に、DB 構造と必須プロパティを先に固定しておかないと、仕様、メモ、タスク、ナレッジが散在しやすい。

## Goal

Notion に作成する主要 DB の構造と、各 DB の必須プロパティ、用途、テンプレート方針を確定する。

## Done Criteria

- [ ] `Projects` `Tasks` `Specs` `Notes` `Knowledge` の役割が明確になっている
- [ ] 各 DB の必須プロパティが定義されている
- [ ] DB 間の relation 方針が定義されている
- [ ] 最低限のページテンプレート方針が決まっている
- [ ] ローカル文書に内容が反映されている

## Notes

- 参照: `docs/notion-schema.md`
- 将来的な Discord 入力と GitHub 同期を前提にした設計にする

## References

- `docs/notion-schema.md`
- `context.md`
```

## Issue 2

### Title

`[P1-02] GitHub の Issue / PR 運用テンプレートを整備する`

### Suggested Labels

- `docs`
- `automation`
- `priority:high`

### Body

```md
## Background

Codex を使って継続的に実装していくには、Issue と PR の書式がぶれない方が管理しやすい。完了条件や確認方法が毎回揃っている状態を先に作る。

## Goal

GitHub の Issue / PR テンプレートとラベル方針を整備し、実装タスクを安定して管理できるようにする。

## Done Criteria

- [ ] Issue template が配置されている
- [ ] PR template が配置されている
- [ ] ラベルの最低構成が文書化されている
- [ ] 運用ルールが `docs/github-workflow.md` に反映されている

## Notes

- 参照: `.github/ISSUE_TEMPLATE/task.md`
- 参照: `.github/pull_request_template.md`
- ラベルは最初から増やしすぎない

## References

- `docs/github-workflow.md`
- `.github/ISSUE_TEMPLATE/task.md`
- `.github/pull_request_template.md`
```

## Issue 3

### Title

`[P1-03] context.md の運用を開始する`

### Suggested Labels

- `docs`
- `design`
- `priority:high`

### Body

```md
## Background

Codex が継続作業をするには、毎回の短期記憶と引き継ぎ情報を残す場所が必要。これがないと、次回起動時に文脈復元コストが高くなる。

## Goal

`context.md` を Codex の短期運用コンテキストとして機能させ、目的、現在地、次アクション、判断ログを更新できる状態にする。

## Done Criteria

- [ ] `context.md` の役割が明文化されている
- [ ] 現在の目的と優先事項が記載されている
- [ ] 次にやることが明記されている
- [ ] 判断ログを追記できる構造になっている

## Notes

- 参照: `context.md`
- 長期保存向きの内容は Notion に寄せる

## References

- `context.md`
- `codex-roadmap.md`
```

## Issue 4

### Title

`[P1-04] Notion / GitHub / context.md の正本ルールを確定する`

### Suggested Labels

- `design`
- `docs`
- `priority:high`

### Body

```md
## Background

情報ハブを作るときに、どこが正本なのかが曖昧だと更新漏れや二重管理が起きやすい。特に Notion、GitHub、ローカル文書の役割分担は最初に明確化したい。

## Goal

Notion、GitHub、`context.md` の責務と正本範囲を定義し、以後の運用判断を迷わない状態にする。

## Done Criteria

- [ ] Notion に置く情報の範囲が明文化されている
- [ ] GitHub に置く情報の範囲が明文化されている
- [ ] `context.md` に残す情報の範囲が明文化されている
- [ ] 運用ルールがローカル文書に反映されている

## Notes

- 正本の競合を避けることを最優先にする
- 後続の Discord 連携でもこのルールを使う

## References

- `context.md`
- `docs/notion-schema.md`
- `docs/github-workflow.md`
```

## Issue 5

### Title

`[P1-05] Phase 1 タスクを GitHub で追跡開始する`

### Suggested Labels

- `docs`
- `automation`
- `priority:medium`

### Body

```md
## Background

Phase 1 の設計文書が揃っても、GitHub 上で追跡できなければ実装の進捗管理が始まらない。まずは Phase 1 のタスクを Issue 化して、着手順と完了条件を見える化したい。

## Goal

Phase 1 の主要項目を GitHub Issue として起票し、優先度順に追跡開始できる状態にする。

## Done Criteria

- [ ] Phase 1 の主要タスクが Issue 化されている
- [ ] 各 Issue に完了条件がある
- [ ] 着手順が決まっている
- [ ] 次の 1 件がアクティブに選べる

## Notes

- 参照: `docs/phase1-tasklist.md`
- 起票時はテンプレートをそのまま使ってよい

## References

- `docs/phase1-tasklist.md`
- `docs/phase1-issues.md`
```

## Recommended Creation Order

1. `[P1-01] Notion DB 初期設計を確定する`
2. `[P1-02] GitHub の Issue / PR 運用テンプレートを整備する`
3. `[P1-03] context.md の運用を開始する`
4. `[P1-04] Notion / GitHub / context.md の正本ルールを確定する`
5. `[P1-05] Phase 1 タスクを GitHub で追跡開始する`
