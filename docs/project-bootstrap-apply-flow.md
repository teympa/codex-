# Project Bootstrap Apply Flow

## Goal

`bootstrap:project` で生成した spec draft と issue seeds を、Notion と GitHub へまとめて反映する。

## Command

```bash
npm run apply:bootstrap -- --title "Project Name"
```

本実行:

```bash
npm run apply:bootstrap -- --title "Project Name" --apply
```

Discord から実行する場合:

```text
/codex-apply-bootstrap title:Project Name
/codex-apply-bootstrap title:Project Name dry_run:false
```

## Behavior

- 既定は dry-run
- dry-run では Notion Spec 作成 dry-run と GitHub Issue 作成 dry-run をまとめて返す
- `--apply` または `dry_run:false` では両方を本実行する

## Expected Files

同じ日付で生成済みの以下ファイルを前提にする。

- `drafts/specs/YYYYMMDD-project-name-spec.md`
- `drafts/issue-seeds/YYYYMMDD-project-name-issue-seeds.md`

## Notes

- `bootstrap:project` 実行後の反映導線
- Notion と GitHub の本実行条件は両方満たす必要がある
- 本実行には `NOTION_API_TOKEN` と `GITHUB_TOKEN` が必要
