# Context

## Objective

このワークスペースは、Codex を中核にして以下を継続運用できる基盤を作るためのものです。

- Notion を情報ハブにする
- GitHub で開発進行を管理する
- Discord からスマホ経由で操作できるようにする
- ゲーム開発の企画、実装、アセット生成、発信までをつなぐ

## Current Focus

- Phase 1 の基盤整備を進める
- 情報の保存先と参照先を固定する
- Notion と GitHub の運用ルールを決める
- Codex が毎回迷わず更新できるローカル文書を整える

## Active Deliverables

- `codex-roadmap.md`
- `docs/notion-schema.md`
- `docs/github-workflow.md`
- `docs/notion-build-guide.md`
- `docs/notion-templates.md`
- `docs/github-labels.md`
- `docs/github-issue-pr-playbook.md`
- `docs/phase1-backlog.md`
- `docs/phase1-issue-creation-checklist.md`
- `docs/context-workflow.md`
- `docs/context-template.md`
- `docs/source-of-truth-policy.md`

## Source Of Truth

- ナレッジと人間向け参照の正本: Notion
- 開発作業の履歴とコードの正本: GitHub
- Codex の短期的な作業文脈と引き継ぎ: `context.md`

## Working Rules

- 新しい設計判断をしたら、Notion とローカル文書のどちらに残すべきかを決める
- 実装タスクは GitHub Issue 化できる粒度まで落とす
- 長期保管したい内容は Notion に寄せる
- 次回起動時に迷う情報は `context.md` に要約する
- セッションの最後に `Immediate Next Steps` と `Handoff` を必ず見直す
- 設計判断は `Decision Log` に短く残す

## Immediate Next Steps

1. Notion の 5 DB を実際に反映する
2. 正本ルールを運用の中で崩さないように各更新時に確認する
3. Phase 2 に向けた Discord 操作設計の前提を整理する
4. Notion と GitHub の同期対象を必要最小限に絞る

## Decision Log

- 2026-04-20: 4フェーズ構成で進める
- 2026-04-20: Phase 1 は Notion、GitHub、`context.md` の基盤整備を優先する
- 2026-04-20: 情報ハブは Notion、開発履歴は GitHub、作業引き継ぎは `context.md` に分担する
- 2026-04-20: P1-01 では Notion の DB 設計に加えて、構築順、relation、テンプレート本文までローカルで先に固める
- 2026-04-20: P1-02 では GitHub のテンプレートに加えて、ラベル体系と日常運用ルールもローカルで先に固める
- 2026-04-20: P1-05 では Phase 1 の Issue を起票しやすいように、バックログ、起票順、初期状態をローカルで先に固定する
- 2026-04-20: Issue #3 に対応して、`context.md` の更新タイミングと最小更新項目をローカル文書で固定する
- 2026-04-20: Issue #4 に対応して、長期人間向け情報は Notion、実装履歴は GitHub、短期文脈は `context.md` を正本とする方針を固定する

## References

- `codex-roadmap.md`
- `docs/notion-schema.md`
- `docs/github-workflow.md`
- `docs/notion-build-guide.md`
- `docs/notion-templates.md`
- `docs/github-labels.md`
- `docs/github-issue-pr-playbook.md`
- `docs/phase1-backlog.md`
- `docs/phase1-issue-creation-checklist.md`
- `docs/context-workflow.md`
- `docs/context-template.md`
- `docs/source-of-truth-policy.md`

## Handoff

- 次は Notion 上に 5 DB を手動または MCP 経由で実際に作る
- 情報を更新するときは、先に正本がどこかを確認する
- セッションを閉じる前に `Immediate Next Steps` と `Handoff` を毎回更新する
- Discord 操作は Phase 1 の運用ルールが固まってから実装に入る
