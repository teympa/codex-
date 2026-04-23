# Proposal Template Generator

## Goal

ゲーム企画のアイデアを、すぐに企画書のたたき台 Markdown へ落とすための CLI ツール。

## Command

```bash
npm run generate:proposal -- --title "Project Name"
```

## Example

```bash
npm run generate:proposal -- --title "Neon Courier" --genre "Action Runner" --platform "PC / Mobile" --audience "midcore players" --coreHook "high-speed delivery under shifting city hazards" --mode "solo"
```

## Output

生成先:

- `drafts/proposals/YYYYMMDD-project-name.md`

生成される主なセクション:

- Snapshot
- Concept
- Goals
- Core Loop
- Pillars
- Scope
- Feature Breakdown
- Asset Needs
- Risks
- Milestones
- GitHub Issue Seeds
- Open Questions
- References
- Change Log

## Supported Options

- `--title` 必須
- `--project`
- `--genre`
- `--platform`
- `--audience`
- `--coreHook`
- `--mode`

## Intended Workflow

1. アイデアが出たら `generate:proposal` でたたき台を作る
2. `drafts/proposals/` の Markdown を埋める
3. 内容を Notion `Specs` または `Projects` に移す
4. `GitHub Issue Seeds` を実際の Issue へ分解する

## Notes

- 同じ日付と同じ title で同名ファイルが既にある場合は上書きしない
- まずはローカル Markdown で構想を固めるための最小実装
- 将来的には Discord から起動したり、Notion `Specs` へ直接流し込む拡張を想定している
