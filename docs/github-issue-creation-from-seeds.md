# GitHub Issue Creation From Seeds

## Goal

`drafts/issue-seeds/` にある Issue 下書き Markdown から、GitHub Issue をまとめて作成する。

## Command

```bash
npm run create:github-issues -- --file 20260423-project-name-issue-seeds.md
```

本実行:

```bash
npm run create:github-issues -- --file 20260423-project-name-issue-seeds.md --apply
```

Discord から実行する場合:

```text
/codex-create-issues-from-seeds issue_seed_file:20260423-project-name-issue-seeds.md
/codex-create-issues-from-seeds issue_seed_file:20260423-project-name-issue-seeds.md dry_run:false
```

## Required Environment Variable

本実行には `GITHUB_TOKEN` が必要。

```env
GITHUB_TOKEN=
```

## Behavior

- 既定は dry-run
- dry-run では作成対象タイトル一覧だけを返す
- `--apply` または `dry_run:false` で GitHub Issue を実際に作成する
- repository は `config/status-sources.json` の `github.repository` を使う

## Input

- `drafts/issue-seeds/` の Markdown
- 各項目に `Suggested Title` と `Suggested Body` が必要

## Notes

- Issue 作成はタイトルと本文のみ
- ラベル、assignee、milestone はまだ自動設定しない
- まずは安全に Issue 起票までつなぐ最小実装
