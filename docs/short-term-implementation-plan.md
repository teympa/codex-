# 短期実装計画

## 現在地

2026-04-21 時点で、以下は実装済みです。

- Phase 1 の基盤文書整備
- GitHub Issue `#1` から `#5` の起票
- `context.md` 運用開始
- 正本ルールの固定
- GitHub と Notion の同期方針固定
- Notion の 5 DB 作成と初期データ投入
- Discord Bot MVP 実装
- `/codex` `/codex-status` `/codex-confirm` の実装
- Discord 実行ログ保存
- Discord allowlist ベースのアクセス制御
- 確認待ちアクションの永続化
- GitHub Issue -> Notion `Tasks` の半自動同期
- `/codex-status` の短縮要約化

## 現在の評価

- Phase 1 はほぼ実用段階
- Phase 2 は MVP 完了
- 次は運用強化と管理コマンド追加が効果大
- Phase 3 はまだ入口設計段階

## 優先順位

1. Phase 2 の運用強化
2. Phase 1 の完了整理
3. Phase 3 の入口実装
4. Phase 4 の準備

## 直近タスク

### 1. Discord 管理コマンド追加

目的:

- Discord 運用を日常利用しやすくする

候補:

- 確認待ち一覧を見るコマンド
- `sync:tasks` を実行する管理コマンド
- 実行ログの最新数件を確認するコマンド

完了条件:

- Discord だけで pending 状態を把握できる
- Discord だけで同期実行の入口を持てる

### 2. allowlist の実運用反映

目的:

- bypass 実行の安全性を実運用レベルに上げる

やること:

- `.env` に本番利用の channel / user を反映
- 運用対象チャンネルを固定
- 必要なら公開チャンネルと管理チャンネルを分ける

完了条件:

- Bot が意図したチャンネルとユーザーでのみ動く

### 3. `/codex-status` の最終調整

目的:

- スマホから一目で状況が分かる状態にする

やること:

- 文量の最終調整
- 必要なら open issue があるときだけ詳細を増やす
- 必要なら Notion spotlight の選び方を調整する

完了条件:

- 10 秒以内に読める status 返答になる

## Phase 1 の締め

### 4. Phase 1 完了整理

目的:

- ここまでの基盤整備を明確に完了扱いできるようにする

やること:

- `README.md`
- `context.md`
- `codex-roadmap.md`
- GitHub Issue `#1` から `#5`

を現状に合わせて見直す

完了条件:

- Phase 1 の状態が文書、GitHub、Notion で矛盾しない

## Phase 3 の入口

### 5. ゲーム企画テンプレ自動化

目的:

- 企画から実装へ移る最初の流れを作る

やること:

- 企画書 Markdown テンプレート
- Notion `Specs` 向けテンプレート運用
- GitHub Issue への分解方針

完了条件:

- アイデアから企画書初版を素早く作れる

### 6. プロジェクト雛形生成

目的:

- 新規ゲームプロジェクトの立ち上がりを早くする

やること:

- repo 初期構成テンプレート
- docs 初期セット
- issue 初期セット

完了条件:

- 新規プロジェクト開始時の手作業を減らせる

## いま一番おすすめの次の 1 手

- 確認待ち一覧を見られる Discord 管理コマンドを追加する

理由:

- 既存の pending-confirmations 永続化と相性がいい
- 日常運用の体感がすぐ上がる
- Phase 2 の完成度を一段上げられる

## 次の実装順

1. 確認待ち一覧コマンド
2. `sync:tasks` 実行コマンド
3. allowlist 本番反映
4. `/codex-status` 微調整
5. Phase 1 完了整理
6. 企画テンプレ自動化
