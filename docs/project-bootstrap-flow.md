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

## Notes

- 既存の `generate:proposal` `generate:spec` `generate:issue-seeds` を順番に呼ぶ薄いラッパー
- 同名ファイルが既にある場合は既存スクリプト側で停止する
