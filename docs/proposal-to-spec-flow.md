# Proposal To Spec Flow

## Goal

`drafts/proposals/` にある企画書ドラフトから、Notion `Specs` に寄せる前段の spec draft Markdown を生成する。

## Command

```bash
npm run generate:spec -- --file 20260423-project-name.md
```

Discord から生成する場合:

```text
/codex-generate-spec proposal_file:20260423-project-name.md
```

## Output

生成先:

- `drafts/specs/YYYYMMDD-project-name-spec.md`

内容:

- Background
- Goal
- Scope
- Requirements
- User Flow
- Functional Details
- Non-Functional Requirements
- Risks
- Open Questions
- References
- Change Log

## Intended Workflow

1. `/codex-generate-proposal` または `generate:proposal` で企画書ドラフトを作る
2. `generate:spec` または `/codex-generate-spec` で spec draft を作る
3. `drafts/specs/` の内容を整える
4. Notion `Specs` に移す
5. 必要に応じて GitHub Issue とリンクする

## Notes

- proposal の主要セクションを spec 用に再配置する最小実装
- Notion 直接書き込みではなく、まずはローカル Markdown を正す運用
- 将来的には Notion `Specs` への直接作成も拡張候補
