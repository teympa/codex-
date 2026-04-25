# Project Bootstrap Flow

## Goal

新しいゲーム企画を開始するときに、proposal / spec draft / issue seeds を一括生成する。

## Command

```bash
npm run bootstrap:project -- --title "Project Name"
```

Discord から実行する場合:

```text
/codex-bootstrap-project title:Project Name
```

反映まで進める場合:

```bash
npm run apply:bootstrap -- --title "Project Name"
```

```text
/codex-apply-bootstrap title:Project Name
```

必要なら bootstrap 後に生成済みファイルを直接指定して反映できる:

```text
/codex-apply-bootstrap spec_file:20260424-project-name-spec.md issue_seed_file:20260424-project-name-issue-seeds.md
```

## Output

まとめて生成されるもの:

- `drafts/proposals/YYYYMMDD-project-name.md`
- `drafts/specs/YYYYMMDD-project-name-spec.md`
- `drafts/issue-seeds/YYYYMMDD-project-name-issue-seeds.md`

## Supported Options

- `--title` 必須
- `--project`
- `--genre`
- `--platform`
- `--audience`
- `--coreHook`
- `--mode`

## Intended Workflow

1. `bootstrap:project` で 3 種類の下書きをまとめて作る
2. proposal を軽く整える
3. spec draft を詰める
4. issue seeds を確認する
5. 必要なら GitHub Issue と Notion `Specs` へ流す

## Recommended Operation

1. `npm run bootstrap:project -- --title "Project Name"` で下書きを生成する
2. `drafts/proposals/` の proposal を確認する
3. `drafts/specs/` の spec draft を確認する
4. `drafts/issue-seeds/` の Issue seeds を確認する
5. `npm run apply:bootstrap -- --title "Project Name"` で dry-run する
6. dry-run の Notion / GitHub preview を確認する
7. 問題がなければ `npm run apply:bootstrap -- --title "Project Name" --apply` を実行する

## Notes

- 既存の `generate:proposal` `generate:spec` `generate:issue-seeds` を順番に呼ぶ薄いラッパー
- 同名ファイルが既にある場合は既存スクリプト側で停止する
