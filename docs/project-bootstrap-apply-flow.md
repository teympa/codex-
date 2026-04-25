# Project Bootstrap Apply Flow

## Goal

`bootstrap:project` で生成した spec draft と issue seeds を、Notion と GitHub へまとめて反映する。

## Command

```bash
npm run apply:bootstrap -- --title "Project Name"
```

特定ファイルを指定する場合:

```bash
npm run apply:bootstrap -- --specFile 20260424-project-name-spec.md --issueSeedFile 20260424-project-name-issue-seeds.md
npm run apply:bootstrap -- --spec_file 20260424-project-name-spec.md --issue_seed_file 20260424-project-name-issue-seeds.md
```

本実行:

```bash
npm run apply:bootstrap -- --title "Project Name" --apply
```

Discord から実行する場合:

```text
/codex-apply-bootstrap title:Project Name
/codex-apply-bootstrap title:Project Name dry_run:false
/codex-apply-bootstrap spec_file:20260424-project-name-spec.md issue_seed_file:20260424-project-name-issue-seeds.md
```

## Behavior

- 既定は dry-run
- `title` だけを渡した場合は、該当タイトルの最新 spec / issue seeds を自動で探す
- `spec_file` と `issue_seed_file` を指定すると、そのファイルを使う
- dry-run では Notion Spec 作成 dry-run と GitHub Issue 作成 dry-run をまとめて返す
- dry-run は spec title、source file、body preview、作成予定 Issue の title / labels / body preview を返す
- `--apply` または `dry_run:false` では両方を本実行する

## File Resolution Rule

- `--title` のみ指定した場合は、タイトル slug に一致する最新の spec / issue seeds を使う
- `--specFile` と `--issueSeedFile` を指定した場合は、そのファイルを使う
- CLI では `--spec_file` と `--issue_seed_file` も同じ意味で使える
- Discord では `spec_file` と `issue_seed_file` を使う

## Expected Files

生成済みの以下ファイルを前提にする。

- `drafts/specs/YYYYMMDD-project-name-spec.md`
- `drafts/issue-seeds/YYYYMMDD-project-name-issue-seeds.md`

## Notes

- `bootstrap:project` 実行後の反映導線
- 日付をまたいだ場合でも、タイトル一致の最新ファイルを解決できる
- Notion と GitHub の本実行条件は両方満たす必要がある
- 本実行には `NOTION_API_TOKEN` と `GITHUB_TOKEN` が必要
