# Bootstrap Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `bootstrap:project` から `apply:bootstrap` までを、CLI と Discord の両方で安全に実運用できる状態にする。

**Architecture:** 既存の生成スクリプト群はそのまま活かし、`src/apply-bootstrap-project.js` を「成果物解決・事前確認・一括実行」の薄いオーケストレーターとして強化する。Discord 側は `src/bot.js` の既存 slash command 入口に合わせて、dry-run 表示と apply 制限の案内をスマホで読める短さに整える。

**Tech Stack:** Node.js 20+, CommonJS, npm scripts, Discord.js, Notion API, GitHub REST API.

---

## Scope

この計画で扱うもの:

- `npm run bootstrap:project` の生成物確認
- `npm run apply:bootstrap` の dry-run / apply 前確認
- spec / issue seeds のファイル指定ルール
- Discord の `/codex-apply-bootstrap` 表示と安全導線
- ドキュメント更新
- `context.md` の引き継ぎ更新

この計画で扱わないもの:

- Notion DB スキーマ自体の変更
- GitHub Actions 化
- ComfyUI 連携
- Web ダッシュボード
- note 下書き生成

## File Structure

変更候補:

- Modify: `src/apply-bootstrap-project.js`
  - `--title` とファイル指定から成果物を解決する入口。
  - dry-run / apply の表示と事前チェックを強化する。
- Modify: `src/create-notion-spec-from-draft.js`
  - dry-run 表示で Notion に作られる Spec の要点を読みやすくする。
- Modify: `src/create-github-issues-from-seeds.js`
  - dry-run 表示で作成予定 Issue のタイトル、ラベル、本文冒頭を一覧化する。
- Modify: `src/bot.js`
  - `/codex-apply-bootstrap` の返信文を短くし、dry-run と本実行の違いを明確にする。
- Modify: `src/register-commands.js`
  - slash command の説明文と option 説明を実運用向けに揃える。
- Modify: `docs/project-bootstrap-flow.md`
  - 生成手順と成果物の確認方法を更新する。
- Modify: `docs/project-bootstrap-apply-flow.md`
  - dry-run、本実行、ファイル指定、失敗時の見方を更新する。
- Modify: `docs/discord-bot-reference.md`
  - Discord からの操作手順を更新する。
- Modify: `docs/discord-bot-setup.md`
  - apply 許可チャンネルと環境変数の説明を更新する。
- Modify: `README.md`
  - 主要導線だけ短く反映する。
- Modify: `context.md`
  - `Immediate Next Steps` と `Handoff` を実装結果に合わせて更新する。

検証で使うコマンド:

```powershell
node --check src/apply-bootstrap-project.js
node --check src/create-notion-spec-from-draft.js
node --check src/create-github-issues-from-seeds.js
node --check src/bot.js
node --check src/register-commands.js
npm run bootstrap:project -- --title "Bootstrap Resolution Sample"
npm run apply:bootstrap -- --title "Bootstrap Resolution Sample"
npm run apply:bootstrap -- --specFile 20260425-bootstrap-resolution-sample-spec.md --issueSeedFile 20260425-bootstrap-resolution-sample-issue-seeds.md
```

注意:

- `bootstrap:project` は `drafts/` に Markdown を生成する。
- 検証で生成したサンプル成果物を残すか消すかは、実装セッション開始時に決める。
- `.env` の秘密値は読まない。必要なキー名は `.env.example` とエラーメッセージで確認する。

---

### Task 1: Baseline Verification

**Files:**

- Read: `package.json`
- Read: `src/apply-bootstrap-project.js`
- Read: `src/create-notion-spec-from-draft.js`
- Read: `src/create-github-issues-from-seeds.js`
- Read: `src/bot.js`
- Read: `src/register-commands.js`

- [ ] **Step 1: 現在の git 状態を確認する**

Run:

```powershell
git status --short
```

Expected:

```text
README.md, context.md, docs/*, src/* に既存変更がある場合は、ユーザー変更として扱い、勝手に戻さない。
```

- [ ] **Step 2: 主要スクリプトの構文確認をする**

Run:

```powershell
node --check src/apply-bootstrap-project.js
node --check src/create-notion-spec-from-draft.js
node --check src/create-github-issues-from-seeds.js
node --check src/bot.js
node --check src/register-commands.js
```

Expected:

```text
各コマンドが何も出さず exit code 0 で終了する。
```

- [ ] **Step 3: help 出力を確認する**

Run:

```powershell
npm run apply:bootstrap -- --help
```

Expected:

```text
Usage:
  npm run apply:bootstrap -- --title "Project Name" [--apply]
  npm run apply:bootstrap -- --specFile 20260424-project-name-spec.md --issueSeedFile 20260424-project-name-issue-seeds.md [--apply]
Default mode is dry-run.
```

- [ ] **Step 4: 生成物がない状態のエラーを確認する**

Run:

```powershell
npm run apply:bootstrap -- --title "Definitely Missing Bootstrap Sample"
```

Expected:

```text
No generated file found for "Definitely Missing Bootstrap Sample" ...
Usage:
  npm run apply:bootstrap ...
```

### Task 2: CLI Option Aliases And Artifact Resolution

**Files:**

- Modify: `src/apply-bootstrap-project.js`
- Verify: `node --check src/apply-bootstrap-project.js`

- [ ] **Step 1: `parseArgs` の結果を正規化する helper を追加する**

Add near the existing `requireValue` function:

```js
function firstValue(args, keys) {
  for (const key of keys) {
    const value = args[key];
    if (value && value !== "true") {
      return value.trim();
    }
  }

  return "";
}
```

- [ ] **Step 2: `resolveBootstrapArtifacts` で alias を受ける**

Replace the first lines of `resolveBootstrapArtifacts(args)` with:

```js
function resolveBootstrapArtifacts(args) {
  const title = firstValue(args, ["title"]);
  const specFile = firstValue(args, ["specFile", "spec_file", "spec-file"]);
  const issueSeedFile = firstValue(args, [
    "issueSeedFile",
    "issue_seed_file",
    "issue-seed-file",
  ]);
  const hasSpecFile = Boolean(specFile);
  const hasIssueSeedFile = Boolean(issueSeedFile);
```

Then replace later references:

```js
specPath: resolveExistingFile(SPECS_DIR, specFile, "Spec"),
issueSeedPath: resolveExistingFile(ISSUE_SEEDS_DIR, issueSeedFile, "Issue seed"),
```

and:

```js
? resolveExistingFile(SPECS_DIR, specFile, "Spec")
```

```js
? resolveExistingFile(ISSUE_SEEDS_DIR, issueSeedFile, "Issue seed")
```

- [ ] **Step 3: help に alias を明記する**

Update `printUsage()` so the specific file form includes both camelCase and Discord-style names:

```text
  npm run apply:bootstrap -- --specFile 20260424-project-name-spec.md --issueSeedFile 20260424-project-name-issue-seeds.md [--apply]
  npm run apply:bootstrap -- --spec_file 20260424-project-name-spec.md --issue_seed_file 20260424-project-name-issue-seeds.md [--apply]
```

- [ ] **Step 4: 構文確認をする**

Run:

```powershell
node --check src/apply-bootstrap-project.js
```

Expected:

```text
何も出さず exit code 0。
```

### Task 3: Apply Bootstrap Preflight Summary

**Files:**

- Modify: `src/apply-bootstrap-project.js`
- Verify: `node --check src/apply-bootstrap-project.js`

- [ ] **Step 1: `relativePath` helper を追加する**

Add after `runNodeScript`:

```js
function relativePath(filePath) {
  return path.relative(ROOT_DIR, filePath) || filePath;
}
```

- [ ] **Step 2: apply 実行時の環境変数チェックを追加する**

Add after `relativePath`:

```js
function validateApplyEnvironment() {
  const missing = [];

  if (!process.env.NOTION_API_TOKEN) {
    missing.push("NOTION_API_TOKEN");
  }

  if (!process.env.GITHUB_TOKEN) {
    missing.push("GITHUB_TOKEN");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for --apply: ${missing.join(", ")}`
    );
  }
}
```

- [ ] **Step 3: `dotenv` を読み込む**

At the top of `src/apply-bootstrap-project.js`, add:

```js
require("dotenv").config();
```

- [ ] **Step 4: `main()` で本実行前に環境変数を検証する**

After:

```js
const apply = args.apply === "true";
```

Add:

```js
if (apply) {
  validateApplyEnvironment();
}
```

- [ ] **Step 5: dry-run / apply の事前サマリを出す**

Before running `create-notion-spec-from-draft.js`, add:

```js
console.log(apply ? "Bootstrap apply preflight." : "Bootstrap dry-run preflight.");
console.log("");
console.log(`- mode: ${apply ? "apply" : "dry-run"}`);
console.log(`- spec file: ${relativePath(specPath)}`);
console.log(`- issue seeds file: ${relativePath(issueSeedPath)}`);
console.log("");
```

- [ ] **Step 6: 既存の `path.relative` 表示を helper に統一する**

Replace:

```js
path.relative(ROOT_DIR, specPath)
path.relative(ROOT_DIR, issueSeedPath)
```

with:

```js
relativePath(specPath)
relativePath(issueSeedPath)
```

- [ ] **Step 7: 構文確認をする**

Run:

```powershell
node --check src/apply-bootstrap-project.js
```

Expected:

```text
何も出さず exit code 0。
```

### Task 4: Notion Spec Dry-Run Preview

**Files:**

- Modify: `src/create-notion-spec-from-draft.js`
- Verify: `node --check src/create-notion-spec-from-draft.js`

- [ ] **Step 1: dry-run 出力の現在形を確認する**

Run:

```powershell
npm run create:notion-spec -- --help
```

Expected:

```text
spec draft から Notion Specs page を作るための使い方が表示される。
```

- [ ] **Step 2: dry-run 出力に title / source file / body preview を含める**

Modify the dry-run branch so it prints this shape:

```text
[dry-run] create Notion spec
- title: <parsed title>
- source file: drafts/specs/<file>
- database: Specs
- body preview:
  <first non-empty lines>
```

Implementation rule:

```js
const previewLines = markdown
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .slice(0, 8);
```

- [ ] **Step 3: apply 時の成功出力を短くする**

Ensure successful apply prints:

```text
created Notion spec: <title>
<notion page url if available>
```

- [ ] **Step 4: 構文確認をする**

Run:

```powershell
node --check src/create-notion-spec-from-draft.js
```

Expected:

```text
何も出さず exit code 0。
```

### Task 5: GitHub Issue Seeds Dry-Run Preview

**Files:**

- Modify: `src/create-github-issues-from-seeds.js`
- Verify: `node --check src/create-github-issues-from-seeds.js`

- [ ] **Step 1: dry-run 出力の現在形を確認する**

Run:

```powershell
npm run create:github-issues -- --help
```

Expected:

```text
Issue seed Markdown から GitHub Issue を作るための使い方が表示される。
```

- [ ] **Step 2: dry-run 出力を Issue 単位の一覧にする**

Dry-run output should follow this shape:

```text
[dry-run] create GitHub issues from drafts/issue-seeds/<file>
- #1 <title>
  labels: <comma separated labels or none>
  body: <first 160 characters>
- #2 <title>
  labels: <comma separated labels or none>
  body: <first 160 characters>
```

Implementation rule for body preview:

```js
function previewText(value, maxLength = 160) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength - 3)}...`;
}
```

- [ ] **Step 3: apply 時の成功出力を Issue URL 一覧にする**

Apply output should follow this shape:

```text
created GitHub issues
- #12 <title> <url>
- #13 <title> <url>
```

- [ ] **Step 4: 構文確認をする**

Run:

```powershell
node --check src/create-github-issues-from-seeds.js
```

Expected:

```text
何も出さず exit code 0。
```

### Task 6: Discord Apply Bootstrap Response

**Files:**

- Modify: `src/bot.js`
- Modify: `src/register-commands.js`
- Verify: `node --check src/bot.js`
- Verify: `node --check src/register-commands.js`

- [ ] **Step 1: `/codex-apply-bootstrap` の handler を確認する**

Run:

```powershell
Select-String -Path src\bot.js -Pattern 'handleBootstrapApply|codex-apply-bootstrap|canApplyBootstrapArtifacts' -Context 0,20
```

Expected:

```text
dry_run:false の許可チェック、option 取得、子プロセス実行箇所が見つかる。
```

- [ ] **Step 2: Discord 返信の見出しを短くする**

For dry-run success, response should start with:

```text
Bootstrap dry-run completed.
```

For apply success, response should start with:

```text
Bootstrap apply completed.
```

For blocked apply, response should include:

```text
This channel cannot run dry_run:false.
Run dry_run:true first, or use an allowed apply channel.
```

- [ ] **Step 3: 長い出力は既存の切り詰め helper を使う**

Use the repository's existing Discord output truncation helper in `src/bot.js`. If the helper name is not obvious, search:

```powershell
Select-String -Path src\bot.js -Pattern 'truncate|slice|2000|MAX' -Context 0,4
```

The final message must fit in Discord's message limit and keep the preflight lines visible.

- [ ] **Step 4: slash command option description を揃える**

In `src/register-commands.js`, ensure `/codex-apply-bootstrap` descriptions communicate:

```text
title: 企画タイトル。最新の spec / issue seeds を自動解決する
spec_file: drafts/specs 配下の spec ファイル名
issue_seed_file: drafts/issue-seeds 配下の issue seeds ファイル名
dry_run: true なら確認のみ、false なら Notion / GitHub に反映
```

- [ ] **Step 5: 構文確認をする**

Run:

```powershell
node --check src/bot.js
node --check src/register-commands.js
```

Expected:

```text
各コマンドが何も出さず exit code 0 で終了する。
```

### Task 7: End-To-End Dry-Run Verification

**Files:**

- Generated: `drafts/proposals/20260425-bootstrap-resolution-sample.md`
- Generated: `drafts/specs/20260425-bootstrap-resolution-sample-spec.md`
- Generated: `drafts/issue-seeds/20260425-bootstrap-resolution-sample-issue-seeds.md`

- [ ] **Step 1: サンプル企画を生成する**

Run:

```powershell
npm run bootstrap:project -- --title "Bootstrap Resolution Sample" --genre "Operations Test" --platform "PC" --audience "Solo developer" --coreHook "Verify bootstrap flow" --mode "Single player"
```

Expected:

```text
Project bootstrap completed.
- proposal: drafts/proposals/20260425-bootstrap-resolution-sample.md
- spec: drafts/specs/20260425-bootstrap-resolution-sample-spec.md
- issue seeds: drafts/issue-seeds/20260425-bootstrap-resolution-sample-issue-seeds.md
```

- [ ] **Step 2: title 指定で dry-run する**

Run:

```powershell
npm run apply:bootstrap -- --title "Bootstrap Resolution Sample"
```

Expected:

```text
Bootstrap dry-run preflight.
- mode: dry-run
- spec file: drafts/specs/20260425-bootstrap-resolution-sample-spec.md
- issue seeds file: drafts/issue-seeds/20260425-bootstrap-resolution-sample-issue-seeds.md
[Notion Specs]
[dry-run] create Notion spec
[GitHub Issues]
[dry-run] create GitHub issues
```

- [ ] **Step 3: camelCase ファイル指定で dry-run する**

Run:

```powershell
npm run apply:bootstrap -- --specFile 20260425-bootstrap-resolution-sample-spec.md --issueSeedFile 20260425-bootstrap-resolution-sample-issue-seeds.md
```

Expected:

```text
Bootstrap dry-run preflight.
- mode: dry-run
- spec file: drafts/specs/20260425-bootstrap-resolution-sample-spec.md
- issue seeds file: drafts/issue-seeds/20260425-bootstrap-resolution-sample-issue-seeds.md
```

- [ ] **Step 4: snake_case ファイル指定で dry-run する**

Run:

```powershell
npm run apply:bootstrap -- --spec_file 20260425-bootstrap-resolution-sample-spec.md --issue_seed_file 20260425-bootstrap-resolution-sample-issue-seeds.md
```

Expected:

```text
Bootstrap dry-run preflight.
- mode: dry-run
- spec file: drafts/specs/20260425-bootstrap-resolution-sample-spec.md
- issue seeds file: drafts/issue-seeds/20260425-bootstrap-resolution-sample-issue-seeds.md
```

- [ ] **Step 5: apply の環境変数不足エラーを確認する**

Run in an environment without tokens:

```powershell
npm run apply:bootstrap -- --title "Bootstrap Resolution Sample" --apply
```

Expected:

```text
Missing required environment variables for --apply: NOTION_API_TOKEN, GITHUB_TOKEN
```

If one token is present, only the missing token appears.

### Task 8: Documentation Update

**Files:**

- Modify: `docs/project-bootstrap-flow.md`
- Modify: `docs/project-bootstrap-apply-flow.md`
- Modify: `docs/discord-bot-reference.md`
- Modify: `docs/discord-bot-setup.md`
- Modify: `README.md`

- [ ] **Step 1: `docs/project-bootstrap-flow.md` に運用順を明記する**

Add this workflow:

```markdown
## Recommended Operation

1. `npm run bootstrap:project -- --title "Project Name"` で下書きを生成する
2. `drafts/proposals/` の proposal を確認する
3. `drafts/specs/` の spec draft を確認する
4. `drafts/issue-seeds/` の Issue seeds を確認する
5. `npm run apply:bootstrap -- --title "Project Name"` で dry-run する
6. dry-run の Notion / GitHub preview を確認する
7. 問題がなければ `npm run apply:bootstrap -- --title "Project Name" --apply` を実行する
```

- [ ] **Step 2: `docs/project-bootstrap-apply-flow.md` にファイル指定ルールを明記する**

Include:

```markdown
## File Resolution Rule

- `--title` のみ指定した場合は、タイトル slug に一致する最新の spec / issue seeds を使う
- `--specFile` と `--issueSeedFile` を指定した場合は、そのファイルを使う
- CLI では `--spec_file` と `--issue_seed_file` も同じ意味で使える
- Discord では `spec_file` と `issue_seed_file` を使う
```

- [ ] **Step 3: Discord docs に apply 制限を書く**

In `docs/discord-bot-reference.md`, under `/codex-apply-bootstrap`, include:

```markdown
制限:

- 指定なしでは `dry_run:true`
- `dry_run:false` は `DISCORD_NOTION_APPLY_CHANNEL_IDS` と `DISCORD_ISSUE_APPLY_CHANNEL_IDS` の条件を満たすチャンネルでのみ使う
- 本実行前に dry-run の preview を確認する
```

- [ ] **Step 4: README の Discord MVP コマンド説明を短く更新する**

Add a short bootstrap operation block:

```markdown
Bootstrap flow:

```bash
npm run bootstrap:project -- --title "Project Name"
npm run apply:bootstrap -- --title "Project Name"
npm run apply:bootstrap -- --title "Project Name" --apply
```
```

- [ ] **Step 5: markdown の読み崩れを確認する**

Run:

```powershell
Select-String -Path README.md,docs\project-bootstrap-flow.md,docs\project-bootstrap-apply-flow.md,docs\discord-bot-reference.md,docs\discord-bot-setup.md -Pattern 'TODO|TBD'
```

Expected:

```text
今回追加した箇所に TODO / TBD がない。
```

### Task 9: Context Update And Final Verification

**Files:**

- Modify: `context.md`

- [ ] **Step 1: `context.md` の Completed Items を更新する**

Add one concise bullet:

```markdown
- bootstrap から Notion / GitHub 反映までの dry-run 表示、ファイル指定 alias、実運用手順を整理済み
```

- [ ] **Step 2: `Immediate Next Steps` を更新する**

Replace the bootstrap-focused items with:

```markdown
1. サンプル企画で `bootstrap:project` から `apply:bootstrap --apply` までを実環境で 1 サイクル検証する
2. Discord から `/codex-bootstrap-project` と `/codex-apply-bootstrap` の dry-run を実行してスマホ表示を確認する
3. GitHub Issue 作成後に `sync:tasks:dry` を実行し、Notion `Tasks` 同期結果を確認する
4. 企画テンプレートの genre / platform / audience 入力項目を実運用に合わせて拡張する
```

- [ ] **Step 3: `Handoff` を更新する**

Add:

```markdown
- `apply:bootstrap` は title 指定、camelCase ファイル指定、snake_case ファイル指定で dry-run できる
- 本実行前に Notion / GitHub の作成予定内容を preview で確認する運用にした
```

- [ ] **Step 4: 最終構文確認をする**

Run:

```powershell
node --check src/apply-bootstrap-project.js
node --check src/create-notion-spec-from-draft.js
node --check src/create-github-issues-from-seeds.js
node --check src/bot.js
node --check src/register-commands.js
```

Expected:

```text
各コマンドが何も出さず exit code 0 で終了する。
```

- [ ] **Step 5: 最終 dry-run を実行する**

Run:

```powershell
npm run apply:bootstrap -- --title "Bootstrap Resolution Sample"
```

Expected:

```text
Bootstrap dry-run preflight.
[Notion Specs]
[dry-run] create Notion spec
[GitHub Issues]
[dry-run] create GitHub issues
```

- [ ] **Step 6: 差分を確認する**

Run:

```powershell
git status --short
git diff -- README.md context.md docs/project-bootstrap-flow.md docs/project-bootstrap-apply-flow.md docs/discord-bot-reference.md docs/discord-bot-setup.md src/apply-bootstrap-project.js src/create-notion-spec-from-draft.js src/create-github-issues-from-seeds.js src/bot.js src/register-commands.js
```

Expected:

```text
Bootstrap 実運用固定に関係する差分だけが出る。
秘密値や .env の中身は差分に含まれない。
```

---

## Commit Plan

実装時は、以下の小さなコミットに分ける。

1. `feat: improve bootstrap apply resolution`
   - `src/apply-bootstrap-project.js`
2. `feat: improve bootstrap dry-run previews`
   - `src/create-notion-spec-from-draft.js`
   - `src/create-github-issues-from-seeds.js`
3. `feat: refine discord bootstrap apply flow`
   - `src/bot.js`
   - `src/register-commands.js`
4. `docs: document bootstrap operation flow`
   - `README.md`
   - `docs/project-bootstrap-flow.md`
   - `docs/project-bootstrap-apply-flow.md`
   - `docs/discord-bot-reference.md`
   - `docs/discord-bot-setup.md`
   - `context.md`

## Self-Review

- Spec coverage: Bootstrap 生成、成果物解決、dry-run preview、Discord 操作、docs、context 更新を各 Task に含めた。
- Placeholder scan: `TODO` / `TBD` は計画本文に含めていない。
- Type consistency: CLI option は `specFile` / `issueSeedFile` / `spec_file` / `issue_seed_file` / `spec-file` / `issue-seed-file` に統一した。
- Scope check: Notion DB 変更、ComfyUI、Web dashboard は除外し、Bootstrap 実運用固定に限定した。
