# AGENTS.md

## ドキュメント

- [docs/vision.md](docs/vision.md): アプリの目的・コンセプト・やらないこと
- [docs/content-guide.md](docs/content-guide.md): 問題データ（知識カード・問題）の執筆ガイド。問題を書く・生成するときは必ず従う
- [docs/roadmap.md](docs/roadmap.md): フェーズとタスク。タスクと進捗の唯一の正本。運用ルールはファイル冒頭を参照
- [docs/adr/](docs/adr/README.md): アーキテクチャ上の意思決定

## 開発

| コマンド | 内容 |
|---|---|
| `pnpm dev` | 開発サーバー（`--host` 付き。同じ LAN のスマホから確認できる） |
| `pnpm validate` | `content/` のスキーマ検証と参照整合性チェック |
| `pnpm test` | 採点ロジックと全画面・全出題形式の動作確認（Vitest + jsdom） |
| `pnpm typecheck` | 型チェック |
| `pnpm fetch:images` | 作品画像を Wikimedia Commons から取得して縮小保存 |
| `pnpm check:markers` | マーカー付き画像を `.cache/markers/` に描画（位置の目視確認用） |
| `pnpm check:markers --approve <問題ID>` | 画像を見て位置が正しいと確認した記録を残す |
| `pnpm review <theme>/<category>` | 知識カードと問題をレビュー用の Markdown（`.cache/reviews/`）に出力 |
| `pnpm build:map` | Natural Earth から都道府県地図（`content/_maps/`）を生成 |

- 問題データ（知識カードと問題）は `content/<theme>/<category>.json`、形式は ADR-0008 と `src/schema.ts`。生成時の確認メモは `content/<theme>/<category>.notes.md`
- 問題データを作る・増やすときは `generate-content` スキル（`.claude/skills/generate-content/SKILL.md`）に従う
- 問題データを追加・変更したら `pnpm validate` を通す。マーカーを追加・変更したら `pnpm check:markers` の画像を見て位置を確認し、正しければ `--approve` で記録する。画像を見ずに記録してはいけない

## アーキテクチャ上の意思決定（ADR）

- 設計上の意思決定は `docs/adr/` に ADR として記録している。一覧・ステータス・テンプレートは [docs/adr/README.md](docs/adr/README.md) を参照
- 実装や設計変更の前に関連する ADR を確認し、ADR と矛盾する変更をする場合は先に ADR を追加・更新する
- ADR に沿って実装を完了したら、ステータスを「承認（実装済み）」に更新する

## タスク管理

- タスクを完了したら [docs/roadmap.md](docs/roadmap.md) のチェックボックスを更新する
- タスクをロードマップと GitHub Issues に二重に書かない
