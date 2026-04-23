# Discord Bot Reference

Last updated: 2026-04-22

## Purpose

この Bot は、Discord から Codex に自然文で指示を出し、現在状況の確認、確認待ち管理、GitHub / Notion `Tasks` 同期、実行ログ確認を行うための運用用インターフェース。

## Available Commands

現在使える slash command:

- `/codex`
- `/codex-status`
- `/codex-confirm`
- `/codex-pending`
- `/codex-sync-tasks`
- `/codex-log`
- `/codex-env`
- `/codex-generate-proposal`
- `/codex-bootstrap-project`
- `/codex-apply-bootstrap`
- `/codex-generate-issue-seeds`
- `/codex-generate-spec`
- `/codex-create-spec-in-notion`
- `/codex-create-issues-from-seeds`

## Command Reference

### `/codex`

用途:

- Codex に自然文で指示を送る

入力:

- `instruction` 必須

基本挙動:

- 読み取り系や要約系の指示はそのまま実行する
- 変更系の可能性がある指示は確認待ちにする

確認待ちになりやすい例:

- `commit`
- `push`
- `delete`
- `remove`
- `write`
- `edit`
- `modify`
- `create file`
- `update`
- `install`
- `更新`
- `修正`
- `変更`
- `編集`
- `作成`
- `追加`
- `削除`
- `書き換`
- `保存`
- `反映`
- `実装`
- `インストール`

例:

```text
/codex instruction:現在の進捗を要約して
/codex instruction:README.md を更新して
```

補足:

- 変更系指示は確認 token が発行される
- 実行時は `codex exec` を呼び出す
- 実行モードは `.env` の `DISCORD_CODEX_EXEC_MODE` に従う

### `/codex-status`

用途:

- 現在の作業状況を短く確認する

主な出力:

- `context.md` の `Current Focus`
- `context.md` の `Next Priority`
- `context.md` の `Immediate Next Steps`
- GitHub tracked issues の状況
- Notion `Tasks` の live 集計

補足:

- `NOTION_API_TOKEN` が未設定なら、Notion live 集計は無効表示になる
- スマホ向けの短い要約を返す

### `/codex-confirm`

用途:

- 確認待ち token を承認して変更系処理を続行する

入力:

- `target` 任意

基本挙動:

- `/codex` で発行された token を指定する
- token が存在し、かつ発行された本人なら続行する
- token が無い場合は missing 扱い
- token が他人のものなら拒否する

例:

```text
/codex-confirm target:abc123
```

補足:

- 確認待ちは 24 時間で期限切れになる
- 確認待ち情報は `runtime/pending-confirmations.json` に保存される

### `/codex-pending`

用途:

- 現在の確認待ち一覧を確認する

主な出力:

- 件数
- token
- 経過時間
- 発行ユーザー
- 指示の先頭要約

補足:

- 期限切れ確認待ちは表示前に自動 pruning される
- 最大 10 件まで表示する

### `/codex-sync-tasks`

用途:

- GitHub Issues と Notion `Tasks` の同期を実行する

入力:

- `dry_run` 任意

基本挙動:

- 指定なしでは `dry_run:true`
- `dry_run:true` では更新せず、同期結果を確認する
- `dry_run:false` では Notion `Tasks` を更新する

例:

```text
/codex-sync-tasks
/codex-sync-tasks dry_run:false
```

制限:

- `dry_run:false` は `DISCORD_SYNC_APPLY_CHANNEL_IDS` に入っているチャンネルだけ許可される
- 許可外では拒否し、`dry_run:true` を促す

同期対象:

- GitHub Issue タイトル
- GitHub Issue 番号
- GitHub Issue URL
- `Status`
- `Priority`
- `Category`
- `Source`
- `Assignee`

補足:

- Notion 更新には `NOTION_API_TOKEN` が必要
- 実体は `src/sync-tasks.js` を呼び出す

### `/codex-log`

用途:

- 最新の Bot 実行ログを Discord から確認する

入力:

- `limit` 任意

主な出力:

- 時刻
- event
- user
- command 名
- token や dry-run 情報
- エラーまたは指示の要点

例:

```text
/codex-log
/codex-log limit:12
```

補足:

- 表示件数の既定値は 8
- 最大 20 件まで指定できる
- 元データは `runtime/discord-command-log.jsonl`

### `/codex-env`

用途:

- 現在の Discord 実行環境と allowlist 設定を確認する

主な出力:

- `guild_id`
- `channel_id`
- `user_id`
- `user_tag`
- `DISCORD_ALLOWED_GUILD_IDS`
- `DISCORD_ALLOWED_CHANNEL_IDS`
- `DISCORD_ALLOWED_USER_IDS`
- `DISCORD_SYNC_APPLY_CHANNEL_IDS`

主な用途:

- `.env` に入れる本番運用値の確認
- いまどの allowlist 設定で動いているかの確認

### `/codex-generate-proposal`

用途:

- ゲーム企画書ドラフトを `drafts/proposals/` に生成する

入力:

- `title` 必須
- `project` 任意
- `genre` 任意
- `platform` 任意
- `audience` 任意
- `core_hook` 任意
- `mode` 任意

例:

```text
/codex-generate-proposal title:Neon Courier genre:Action Runner platform:PC / Mobile audience:midcore players core_hook:high-speed delivery under shifting city hazards mode:solo
```

出力:

- `drafts/proposals/YYYYMMDD-title.md`

補足:

- 同じ日付と同じ title のファイルが既にある場合は上書きしない
- 実体は `src/generate-proposal.js` を呼び出す
- 生成後は Notion `Specs` や GitHub Issue への分解に進める

### `/codex-bootstrap-project`

用途:

- proposal / spec draft / issue seeds をまとめて生成する

入力:

- `title` 必須
- `project` 任意
- `genre` 任意
- `platform` 任意
- `audience` 任意
- `core_hook` 任意
- `mode` 任意

例:

```text
/codex-bootstrap-project title:Neon Courier genre:Action Runner platform:PC / Mobile audience:midcore players core_hook:high-speed delivery under shifting city hazards mode:solo
```

出力:

- `drafts/proposals/YYYYMMDD-project-name.md`
- `drafts/specs/YYYYMMDD-project-name-spec.md`
- `drafts/issue-seeds/YYYYMMDD-project-name-issue-seeds.md`

補足:

- 新規企画の最初の足場をまとめて作るためのコマンド
- 実体は `src/bootstrap-project.js` を呼び出す

### `/codex-apply-bootstrap`

用途:

- bootstrap 済みの spec と issue seeds をまとめて反映する

入力:

- `title` 必須
- `dry_run` 任意

例:

```text
/codex-apply-bootstrap title:Neon Courier
/codex-apply-bootstrap title:Neon Courier dry_run:false
```

挙動:

- 既定は `dry_run:true`
- `dry_run:true` では Notion Spec 作成 dry-run と GitHub Issue 作成 dry-run をまとめて返す
- `dry_run:false` では両方を本実行する

補足:

- 本実行には `NOTION_API_TOKEN` と `GITHUB_TOKEN` が必要
- 本実行には Notion / GitHub 両方の apply 条件を満たす必要がある
- 実体は `src/apply-bootstrap-project.js` を呼び出す

### `/codex-generate-issue-seeds`

用途:

- 企画書ドラフトの `GitHub Issue Seeds` から Issue 下書き Markdown を生成する

入力:

- `proposal_file` 必須

例:

```text
/codex-generate-issue-seeds proposal_file:20260423-neon-courier.md
```

出力:

- `drafts/issue-seeds/YYYYMMDD-project-name-issue-seeds.md`

補足:

- `drafts/proposals/` 配下のファイル名を指定する
- `GitHub Issue Seeds` セクションにチェックボックス行が必要
- 実体は `src/generate-issue-seeds.js` を呼び出す

### `/codex-generate-spec`

用途:

- 企画書ドラフトから spec draft Markdown を生成する

入力:

- `proposal_file` 必須

例:

```text
/codex-generate-spec proposal_file:20260423-neon-courier.md
```

出力:

- `drafts/specs/YYYYMMDD-project-name-spec.md`

補足:

- proposal の主要セクションを spec 用に再配置する
- 実体は `src/generate-spec-from-proposal.js` を呼び出す

### `/codex-create-spec-in-notion`

用途:

- spec draft から Notion `Specs` DB に page を作成する

入力:

- `spec_file` 必須
- `dry_run` 任意

例:

```text
/codex-create-spec-in-notion spec_file:20260423-neon-courier-spec.md
/codex-create-spec-in-notion spec_file:20260423-neon-courier-spec.md dry_run:false
```

挙動:

- 既定は `dry_run:true`
- `dry_run:true` では対象 DB、title、block 数を返す
- `dry_run:false` では Notion `Specs` DB に page を作成する

補足:

- 本実行には `NOTION_API_TOKEN` が必要
- `dry_run:false` は `DISCORD_NOTION_APPLY_CHANNEL_IDS` のチャンネルだけ許可する
- 実体は `src/create-notion-spec-from-draft.js` を呼び出す

### `/codex-create-issues-from-seeds`

用途:

- Issue 下書き Markdown から GitHub Issue を作成する

入力:

- `issue_seed_file` 必須
- `dry_run` 任意

例:

```text
/codex-create-issues-from-seeds issue_seed_file:20260423-neon-courier-issue-seeds.md
/codex-create-issues-from-seeds issue_seed_file:20260423-neon-courier-issue-seeds.md dry_run:false
```

挙動:

- 既定は `dry_run:true`
- `dry_run:true` では作成予定タイトル一覧を返す
- `dry_run:false` では GitHub Issue を実際に作成する

補足:

- 本実行には `GITHUB_TOKEN` が必要
- `dry_run:false` は `DISCORD_ISSUE_APPLY_CHANNEL_IDS` のチャンネルだけ許可する
- 実体は `src/create-github-issues-from-seeds.js` を呼び出す

## Visibility

表示設定は `.env` の `DISCORD_REPLY_EPHEMERAL` に従う。

- `true`: 自分だけに表示
- `false`: チャンネル全体に表示

注意:

- 全体表示では token やログ内容も見える
- 運用チャンネルを絞って使うのが安全

## Access Control

Bot には allowlist 制御がある。

- `DISCORD_ALLOWED_GUILD_IDS`
- `DISCORD_ALLOWED_CHANNEL_IDS`
- `DISCORD_ALLOWED_USER_IDS`
- `DISCORD_SYNC_APPLY_CHANNEL_IDS`

挙動:

- guild / channel / user のいずれかで不許可なら拒否
- 拒否は `access_denied` としてログに残る
- `DISCORD_GUILD_ID` は guild allowlist の既定値として扱われる

## Logging

主な保存先:

- 実行ログ: `runtime/discord-command-log.jsonl`
- Bot 標準出力: `runtime/discord-bot.out.log`
- Bot 標準エラー: `runtime/discord-bot.err.log`
- 確認待ち状態: `runtime/pending-confirmations.json`

代表的な event:

- `instruction_received`
- `confirmation_created`
- `confirmation_received`
- `confirmation_accepted`
- `confirmation_missing`
- `execution_started`
- `execution_succeeded`
- `execution_failed`
- `status_requested`
- `status_succeeded`
- `status_failed`
- `pending_list_requested`
- `task_sync_requested`
- `task_sync_succeeded`
- `task_sync_failed`
- `task_sync_apply_denied`
- `command_log_requested`
- `environment_summary_requested`
- `proposal_generation_requested`
- `proposal_generation_succeeded`
- `proposal_generation_failed`
- `project_bootstrap_requested`
- `project_bootstrap_succeeded`
- `project_bootstrap_failed`
- `bootstrap_apply_requested`
- `bootstrap_apply_succeeded`
- `bootstrap_apply_failed`
- `bootstrap_apply_denied`
- `issue_seed_generation_requested`
- `issue_seed_generation_succeeded`
- `issue_seed_generation_failed`
- `spec_generation_requested`
- `spec_generation_succeeded`
- `spec_generation_failed`
- `notion_spec_creation_requested`
- `notion_spec_creation_succeeded`
- `notion_spec_creation_failed`
- `notion_spec_creation_apply_denied`
- `github_issue_creation_requested`
- `github_issue_creation_succeeded`
- `github_issue_creation_failed`
- `github_issue_creation_apply_denied`
- `access_denied`

## Environment Variables

主な設定値:

```env
DISCORD_BOT_TOKEN=
DISCORD_APPLICATION_ID=
DISCORD_GUILD_ID=
NOTION_API_TOKEN=
DISCORD_REPLY_EPHEMERAL=true
DISCORD_CODEX_EXEC_MODE=read-only
DISCORD_ALLOWED_GUILD_IDS=
DISCORD_ALLOWED_CHANNEL_IDS=
DISCORD_ALLOWED_USER_IDS=
DISCORD_SYNC_APPLY_CHANNEL_IDS=
DISCORD_ISSUE_APPLY_CHANNEL_IDS=
DISCORD_NOTION_APPLY_CHANNEL_IDS=
GITHUB_TOKEN=
```

意味:

- `DISCORD_BOT_TOKEN`: Discord Bot トークン
- `DISCORD_APPLICATION_ID`: Discord Application ID
- `DISCORD_GUILD_ID`: guild command 登録先
- `NOTION_API_TOKEN`: Notion live 集計と同期に使用
- `DISCORD_REPLY_EPHEMERAL`: 返答の公開範囲
- `DISCORD_CODEX_EXEC_MODE`: `read-only` または `bypass`
- `DISCORD_ALLOWED_*`: Bot 利用許可範囲
- `DISCORD_SYNC_APPLY_CHANNEL_IDS`: `dry_run:false` 許可チャンネル
- `DISCORD_ISSUE_APPLY_CHANNEL_IDS`: Issue 作成本実行の許可チャンネル
- `DISCORD_NOTION_APPLY_CHANNEL_IDS`: Notion Spec 作成本実行の許可チャンネル
- `GITHUB_TOKEN`: GitHub Issue 作成に使う token

## Operational Notes

- Windows 環境では `read-only` sandbox で `CreateProcessAsUserW failed: 5` が出ることがある
- その場合は `DISCORD_CODEX_EXEC_MODE=bypass` で回避できる
- ただし bypass は強い権限になるため、channel と user の allowlist を必ず絞る

## Recommended Usage Pattern

普段の流れ:

1. `/codex-status` で状況確認
2. `/codex` で指示
3. 変更系なら `/codex-confirm`
4. 必要に応じて `/codex-pending` で確認待ち整理
5. 同期が必要なら `/codex-sync-tasks`
6. 挙動確認は `/codex-log`
7. 設定確認は `/codex-env`
8. 新規企画は `/codex-generate-proposal`
9. 新規企画をまとめて始めるなら `/codex-bootstrap-project`
10. bootstrap 後の反映確認は `/codex-apply-bootstrap`
11. 起票下書きは `/codex-generate-issue-seeds`
12. spec draft は `/codex-generate-spec`
13. Notion Spec 作成は `/codex-create-spec-in-notion`
14. GitHub 実起票は `/codex-create-issues-from-seeds`
