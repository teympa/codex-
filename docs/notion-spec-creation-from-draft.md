# Notion Spec Creation From Draft

## Goal

`drafts/specs/` にある spec draft Markdown から、Notion `Specs` DB に spec page を作成する。

## Command

```bash
npm run create:notion-spec -- --file 20260423-project-name-spec.md
```

本実行:

```bash
npm run create:notion-spec -- --file 20260423-project-name-spec.md --apply
```

Discord から実行する場合:

```text
/codex-create-spec-in-notion spec_file:20260423-project-name-spec.md
/codex-create-spec-in-notion spec_file:20260423-project-name-spec.md dry_run:false
```

## Required Environment Variable

本実行には `NOTION_API_TOKEN` が必要。

## Behavior

- 既定は dry-run
- dry-run では対象タイトル、DB、block 数を返す
- `--apply` または `dry_run:false` で Notion `Specs` DB に page を作成する
- DB は `config/status-sources.json` の `notion.specsDatabaseUrl` を使う

## Notes

- まずは `Title`、`Status`、`Spec Type`、`Source`、`Version`、`Last Reviewed` を設定する
- 本文は Markdown を Notion block に変換して投入する
- relation や project 紐づけはまだ自動設定しない
