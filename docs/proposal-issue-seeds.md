# Proposal Issue Seeds

## Goal

企画書ドラフト内の `GitHub Issue Seeds` セクションから、GitHub Issue の下書き Markdown を生成する。

## Command

```bash
npm run generate:issue-seeds -- --file 20260423-project-name.md
```

Discord から生成する場合:

```text
/codex-generate-issue-seeds proposal_file:20260423-project-name.md
```

## Output

生成先:

- `drafts/issue-seeds/YYYYMMDD-project-name-issue-seeds.md`

内容:

- 企画書タイトル
- 元になった proposal ファイル
- `GitHub Issue Seeds` の件数
- Issue ごとの Suggested Title
- GitHub に貼りやすい Suggested Body

## Intended Workflow

1. `/codex-generate-proposal` または `generate:proposal` で企画書ドラフトを作る
2. `GitHub Issue Seeds` を埋める
3. `generate:issue-seeds` で Issue 下書きを生成する
4. GitHub Issue に貼る
5. 必要なら Notion `Tasks` と同期する

## Notes

- `GitHub Issue Seeds` セクションにチェックボックス形式の行が必要
- 同名の出力ファイルがある場合は上書きしない
- まずはローカル Markdown を生成する最小実装
