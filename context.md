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

## Execution Status

### Completed Items

- Phase 1 の運用前提として、Notion DB 設計、GitHub 運用文書、`context.md` 運用文書、正本ルール、GitHub-Notion 同期方針のローカル草案を一通り作成済み
- Phase 1 を GitHub Issue 単位で追跡しやすいように、バックログ、起票チェックリスト、Issue/PR プレイブック、ラベル設計をローカル文書として整理済み
- Phase 2 着手前提として、Discord を Codex への指示窓口にする方向性と安全確認の初期設計をローカル文書に整理済み
- Discord Bot に実行ログ保存と `/codex-status` の GitHub / Notion 集約を追加済み
- Discord Bot に guild / channel / user の allowlist ベースのアクセス制御を追加済み
- Discord Bot の確認待ちアクションを `runtime/pending-confirmations.json` に永続化済み
- GitHub Issue から Notion `Tasks` への半自動同期スクリプトを追加済み
- ゲーム企画書ドラフトを CLI と Discord から生成できる初期導線を追加済み
- 企画書ドラフトから GitHub Issue 下書きを CLI と Discord から生成できる導線を追加済み
- Issue 下書きから GitHub Issue を dry-run / apply で作成できる導線を CLI と Discord に追加済み
- 企画書ドラフトから spec draft を CLI と Discord で生成できる導線を追加済み
- spec draft から Notion `Specs` page を dry-run / apply で作成できる導線を CLI と Discord に追加済み
- 新規企画の proposal / spec / issue seeds をまとめて起こすブートストラップ導線を CLI と Discord に追加済み
- bootstrap 後の Notion / GitHub 反映をまとめて dry-run / apply できる導線を CLI と Discord に追加済み
- `apply:bootstrap` はタイトルから最新生成物を解決するか、spec / issue-seeds のファイル名を明示して実行できる
- bootstrap から Notion / GitHub 反映までの dry-run 表示、ファイル指定 alias、実運用手順を整理済み
- `Bootstrap Resolution Sample` で `apply:bootstrap --apply` を実行し、Notion `Specs` page と GitHub Issue #7-#10 の作成に成功済み
- `sync:tasks` を本実行し、GitHub Issue #7-#10 を Notion `Tasks` に作成済み
- Discord slash commands を再登録し、Bot `チャッピー#1662` の起動 ready を確認済み
- Discord の `/codex-bootstrap-project` と `/codex-apply-bootstrap` は、スマホ確認向けに日本語の短い要約表示へ変更済み
- Notion `Tasks` の Issue #7-#10 は `Project = Codex Ops`、`Category = Ops` に整理済み

### Incomplete Items

- Notion 上の `Projects` / `Tasks` / `Specs` / `Notes` / `Knowledge` を実環境にまだ作成していない
- GitHub 上で Phase 1 の主要 Issue とテンプレート運用が実際の運用状態まで揃っているか未確認
- GitHub と Notion の同期を、`Tasks` 中心の最小運用として実地で回した結果がまだない
- Discord 側の設計は方針段階で、MVP の操作フローと確認必須操作の具体化は未完了

### Next Priority

- bootstrap から Notion / GitHub 反映までの実運用手順と apply 対象ファイル指定ルールを固める

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
- `docs/github-notion-sync-policy.md`
- `docs/discord-ops-design.md`
- `docs/discord-safety-and-flow.md`

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

1. Discord から `/codex-bootstrap-project` と `/codex-apply-bootstrap` の日本語短縮表示を再確認する
2. サンプル企画 `Bootstrap Resolution Sample` を残すか、検証用として削除するか判断する
3. 企画テンプレートの genre / platform / audience 入力項目を実運用に合わせて拡張する
4. 次の本物の企画で bootstrap -> apply -> sync の一連フローを試す

## Actionable Tasks (2026-04-21)

### High Impact / Can Start Now

1. allowlist の実運用値を `.env` に反映し、運用チャンネルを固定する
2. 確認待ち一覧を見られる管理コマンドを追加する
3. `sync:tasks` の実運用手順を Discord 側に組み込む案を確定する

### Quick Wins (30-60 min)

1. `/codex-status` の文面をさらに圧縮し、スマホ表示を確認する
2. `docs/phase1-backlog.md` の GitHub Setup Checklist を実運用状態で更新する
3. `docs/phase1-issue-creation-checklist.md` に沿って未起票 Issue の有無を再確認する

### External Dependency / Needs Human Action

1. Notion 上に `Projects` / `Tasks` / `Specs` / `Notes` / `Knowledge` を実作成する
2. GitHub 上で Phase 1 Issue とテンプレート運用が実運用状態かを確認する
3. GitHub-Notion 同期を 1 サイクル実行し、`Tasks` 最小同期で回るか検証する

## Decision Log

- 2026-04-20: 4フェーズ構成で進める
- 2026-04-20: Phase 1 は Notion、GitHub、`context.md` の基盤整備を優先する
- 2026-04-20: 情報ハブは Notion、開発履歴は GitHub、作業引き継ぎは `context.md` に分担する
- 2026-04-20: P1-01 では Notion の DB 設計に加えて、構築順、relation、テンプレート本文までローカルで先に固める
- 2026-04-20: P1-02 では GitHub のテンプレートに加えて、ラベル体系と日常運用ルールもローカルで先に固める
- 2026-04-20: P1-05 では Phase 1 の Issue を起票しやすいように、バックログ、起票順、初期状態をローカルで先に固定する
- 2026-04-20: Issue #3 に対応して、`context.md` の更新タイミングと最小更新項目をローカル文書で固定する
- 2026-04-20: Issue #4 に対応して、長期人間向け情報は Notion、実装履歴は GitHub、短期文脈は `context.md` を正本とする方針を固定する
- 2026-04-20: GitHub と Notion の同期は `Tasks` を中心に、実行状態だけを最小限同期する方針を固定する
- 2026-04-20: Phase 2 は Discord を Codex への指示窓口として実装し、危険操作は確認必須にする方針で進める
- 2026-04-21: Discord Bot は bypass 運用を前提に、guild / channel / user の allowlist で利用範囲を絞る
- 2026-04-21: Discord Bot の確認待ち token は 24 時間保持し、再起動後も復元する
- 2026-04-21: GitHub / Notion 同期はまず `sync:tasks` による GitHub から Notion への片方向半自動同期で始める
- 2026-04-21: `/codex-status` はスマホ向けに、focus / next priority / next steps / GitHub要約 / Notion要約の短い形式を既定にする
- 2026-04-21: 確認待ち一覧は `/codex-pending` で Discord から確認できるようにする
- 2026-04-21: `sync:tasks` は `/codex-sync-tasks` から dry-run 既定で実行できるようにする
- 2026-04-22: 実行ログは `/codex-log` で Discord から最新数件を確認できるようにする
- 2026-04-22: `/codex-sync-tasks dry_run:false` は `DISCORD_SYNC_APPLY_CHANNEL_IDS` のチャンネルだけで許可する
- 2026-04-22: `.env` に入れる実運用値確認用に `/codex-env` を追加する
- 2026-04-22: Phase 3 の入口として、ゲーム企画書ドラフトをローカル Markdown で自動生成できるようにする
- 2026-04-23: Discord から `/codex-generate-proposal` でゲーム企画書ドラフトを生成できるようにする
- 2026-04-23: 企画書ドラフトの `GitHub Issue Seeds` から Issue 下書きを CLI と Discord で生成できるようにする
- 2026-04-23: Issue 下書きから GitHub Issue を CLI と Discord で作成できるようにする
- 2026-04-23: 企画書ドラフトから spec draft を CLI と Discord で生成できるようにする
- 2026-04-23: spec draft から Notion `Specs` page を CLI と Discord で作成できるようにする
- 2026-04-24: 新規企画の proposal / spec / issue seeds を CLI と Discord でまとめて生成できるようにする
- 2026-04-24: bootstrap 後の Notion / GitHub 反映を CLI と Discord でまとめて dry-run / apply できるようにする
- 2026-04-24: `apply:bootstrap` は日付固定ではなく、タイトル一致の最新生成物または明示ファイル指定で反映できるようにする

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
- `docs/github-notion-sync-policy.md`
- `docs/discord-ops-design.md`
- `docs/discord-safety-and-flow.md`

## Handoff

- Discord Bot は allowlist ベースのアクセス制御まで入った
- Discord Bot は確認待ちアクション永続化まで入った
- GitHub / Notion `Tasks` 同期の半自動化まで入った
- `/codex-status` の短縮版要約まで入った
- 確認待ち一覧を見られる `/codex-pending` まで入った
- `sync:tasks` を Discord から実行する `/codex-sync-tasks` まで入った
- 実行ログを見られる `/codex-log` まで入った
- `sync:tasks` の本実行チャンネル制限まで入った
- `.env` 反映前に使える `/codex-env` まで入った
- 企画書ドラフト生成は CLI と Discord の両方から使える
- 企画書ドラフトから Issue 下書き生成も CLI と Discord の両方から使える
- GitHub 実 Issue 化も CLI と Discord の両方から使える
- spec draft 生成も CLI と Discord の両方から使える
- Notion `Specs` page 作成も CLI と Discord の両方から使える
- 新規企画のブートストラップも CLI と Discord の両方から使える
- bootstrap 後の一括反映も CLI と Discord の両方から使える
- `apply:bootstrap` は title 指定、camelCase ファイル指定、snake_case ファイル指定で dry-run できる
- 本実行前に Notion / GitHub の作成予定内容を preview で確認する運用にした
- `Bootstrap Resolution Sample` の Notion Spec と GitHub Issue #7-#10 は作成済みで、`sync:tasks:dry` では #7-#10 の Notion `Tasks` 新規作成予定まで確認済み
- GitHub Issue #7-#10 は `sync:tasks` 本実行で Notion `Tasks` に作成済み
- Discord Bot は起動 ready まで確認済み。次は Discord クライアント側から dry-run 表示を確認する
- Discord の bootstrap / apply bootstrap 返信は CLI 詳細ログをそのまま出さず、日本語の要約だけを返す
- Notion `Tasks` の Issue #7-#10 は `Codex Ops` project に紐づけ済みで、Category は `Ops`
- 次回は Notion `Specs` 連携と GitHub / Notion 同期まで含めた実運用を固める
- 情報を更新するときは、先に正本が Notion / GitHub / `context.md` のどれかを確認する
- GitHub と Notion の二重更新は避け、`Tasks` の必要項目だけを同期する
- Discord 実装は安全面の基礎が入ったので、次は運用自動化に寄せる
- セッションを閉じる前に `Execution Status`、`Immediate Next Steps`、`Handoff` を毎回更新する
