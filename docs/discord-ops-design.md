# Discord Ops Design

## Goal

スマホから Discord 経由で Codex に指示を出せるようにする。

## Phase 2 Scope

最初に扱うのは、Discord を `Codex への指示窓口` にすること。

最初に必要な操作は以下。

- 指示の送信
- 指示の実行確認
- 実行結果の返却
- 必要に応じた Notion / GitHub 反映

## Design Principles

- スマホから自然文で送れる
- Discord は入力窓口、Codex が判断と実行を担う
- 危険操作は即実行しない
- Bot を使える場所とユーザーは絞る
- 結果は Discord に短く返す
- 失敗してもログで追える

## Interaction Model

### `/codex`

用途:

- Codex への自然文指示
- 相談
- 調査依頼
- 実装依頼
- Notion / GitHub 更新依頼

入力例:

- `/codex Phase 2 の Discord Bot 設計を整理して`
- `/codex Notion の Tasks に新しい作業を追加して`
- `/codex Issue #3 の進捗を見て次の一手を提案して`
- `/codex 今日の状況を要約して`

### `/codex-status`

用途:

- 現在の作業状況確認
- 進行中タスク確認
- 直近の次アクション確認

主な参照先:

- `context.md`
- GitHub Issue
- Notion `Tasks`

### `/codex-confirm`

用途:

- 確認必須操作の承認
- 保留中アクションの続行

## Execution Model

Discord で受けた指示は、Codex が次のどれかに振り分ける。

- その場で回答
- Notion 更新
- GitHub 更新
- ローカル作業
- 確認待ち

実行前に以下の allowlist を確認する。

- guild
- channel
- user

どれかが設定されている場合は、一致しない操作を拒否する。

## Response Style

Discord 上の返答は短くする。

例:

- `内容を受け取りました。Notion Tasks に反映します`
- `この操作は確認が必要です。続けるなら /codex-confirm`
- `Issue #3 と context.md を見て、次は #4 が自然です`
- `処理に失敗しました。GitHub 側の認証確認が必要です`

## Parsing Strategy

初期は完全自動化を狙わず、以下で始める。

- `/codex` + 自然文
- Codex が意図を判定
- 危険操作は確認待ちにする
- 曖昧なら要約して確認を返す

## Recommended MVP

最初に実装する順:

1. `/codex`
2. `/codex-status`
3. `/codex-confirm`

MVP で最初に通す依頼:

- Notion へのメモ追加
- Notion Tasks への作業追加
- GitHub Issue の要約
- `context.md` ベースの状況回答

## Done Criteria

- Discord から Codex へ自然文指示を送れる
- Codex が安全に実行または確認待ちへ振り分けられる
- 実行結果を Discord に返せる
- 実行ログが追える
- 許可された Discord サーバー / チャンネル / ユーザーだけが使える
