# Discord Safety And Flow

## Goal

Discord から Codex へ送る指示を安全に扱い、誤操作や過剰実行を防ぐ。

## Trust Levels

### Level 1: Safe Query / Capture

そのまま実行してよい操作:

- 要約依頼
- 状況確認
- メモ保存
- 軽いタスク追加

### Level 2: Managed Update

確認なしでもよいが、ログを残す操作:

- Notion `Tasks` の追加
- 既存タスクへの補足追記
- 低リスクな状態更新
- GitHub Issue の参照と要約

### Level 3: Confirm Required

確認が必要な操作:

- GitHub Issue 自動作成
- 状態を `Done` に変える
- 外部サービスへの書き込み
- 自動化や通知の新規登録
- ローカルファイルの変更

### Level 4: Restricted

初期段階では Discord から禁止:

- Git push
- ファイル削除
- 大量一括更新
- 認証情報の変更

## Confirmation Rules

確認が必要な操作では二段階にする。

1. 要約を返す
2. `confirm` 相当の返答で実行する

例:

- `GitHub Issue を作成します: Discord Bot の最小構成。続行する場合は confirm`

## Error Handling

エラー時は短く返す。

- 何をしようとしたか
- どこで失敗したか
- 再試行が必要か

例:

- `Tasks への保存に失敗しました`
- `GitHub 連携前提のため保留しました`

## Logging

最低限ログに残すもの:

- 実行時刻
- コマンド種別
- 入力本文
- 実行結果
- 保存先

初期は Notion `Notes` またはローカルログでよい。

## Minimal Flow

### `/codex`

1. Discord で指示を受信
2. Codex が意図を判定
3. 安全なら実行、危険なら確認待ち
4. 結果を Discord に返す

### `/codex-status`

1. `context.md` と Notion / GitHub を参照
2. 短い要約を返す

## Security Notes

- Bot を使うチャンネルは限定する
- 管理系コマンドは自分だけに絞る
- Webhook だけでなく実行者識別を残す
- 重要操作は DM か専用チャンネルに分ける

## MVP Recommendation

まずは Codex への安全な入口だけ本実装する。

- `/codex`
- `/codex-status`
- `/codex-confirm`

GitHub 書き込みや外部サービス反映は次段階で確認付きにする
