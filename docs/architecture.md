# アーキテクチャ

いまの構成を図で示す。決定の理由は各 ADR に書き、この文書には「いまどうなっているか」だけを書く。構成を変えたらこの文書も更新する。

図の点線は、ADR で採用済みだがまだ実装していない部分（Phase 2 以降）。

## 構成図

```mermaid
flowchart LR
  dev["開発者の手元"]
  gh["GitHub<br/>nangashi/question"]
  fonts["Google Fonts"]

  subgraph cf["Cloudflare"]
    build["Workers Builds<br/>pnpm build → wrangler deploy"]
    worker["Worker: manabi-card<br/>Static Assets（./dist）"]
    api["Hono API<br/>POST /sessions・GET /stats/*"]:::future
    d1[("D1")]:::future
  end

  subgraph phone["スマホ（PWA）"]
    app["アプリ<br/>Preact"]
    sw["Service Worker<br/>プリキャッシュ"]
    idb[("IndexedDB<br/>解答ログ")]
    ls[("localStorage<br/>出題中の状態")]
  end

  claude["Claude の定期実行"]:::future

  dev -- "git push main" --> gh
  gh -- "GitHub 連携" --> build
  build --> worker
  dev -. "pnpm run deploy（手動）" .-> worker
  worker -- "HTTPS<br/>manabi-card.tagjmp.workers.dev" --> sw
  fonts -- "初回のみ取得して保存" --> sw
  sw --> app
  app --- idb
  app --- ls
  app -. "1 回の学習ごとに送信" .-> api
  api -.- d1
  claude -. "Bearer トークン" .-> api

  classDef future stroke-dasharray: 5 5,color:#888
```

| 部分 | いまの状態 | 設定・実装 | 関連 ADR |
|---|---|---|---|
| 静的配信 | 実装済み。JS・CSS・問題データ・画像をすべて `dist/` に含めて配信する | `wrangler.jsonc` | [0005](adr/0005-cloudflare-workers-d1.md), [0012](adr/0012-pwa-and-deploy.md) |
| デプロイ | 実装済み。`main` への push で Workers Builds が動く。手元からの `pnpm run deploy` も使える | Cloudflare の画面の GitHub 連携、`package.json` の `build`・`deploy` | [0012](adr/0012-pwa-and-deploy.md) |
| PWA | 実装済み。ビルドしたファイルをすべてプリキャッシュし、オフラインでも使える | `vite.config.ts` | [0012](adr/0012-pwa-and-deploy.md) |
| 端末内の保存 | 実装済み。解答ログは IndexedDB、出題中の状態は localStorage | `src/` | [0003](adr/0003-local-first-review-log.md) |
| API と D1 | 未実装（Phase 2） | — | [0005](adr/0005-cloudflare-workers-d1.md) |
| Claude 連携 | 未実装（Phase 2） | — | [0006](adr/0006-learning-stats-for-claude.md) |

## デプロイと更新の流れ

```mermaid
sequenceDiagram
  actor dev as 開発者
  participant gh as GitHub
  participant build as Workers Builds
  participant worker as Worker（Static Assets）
  participant sw as スマホの Service Worker

  dev->>gh: git push main
  gh->>build: push を通知
  build->>build: pnpm build（問題データの検証・型チェック・vite build）
  build->>worker: wrangler deploy
  Note over worker: 新しい版を配信開始
  sw->>worker: アプリを開いたときに更新を確認
  worker-->>sw: 新しいファイル一式
  sw->>sw: プリキャッシュを入れ替えて再読み込み（autoUpdate）
  Note over sw: 出題中の状態は localStorage から復元する
```

- 更新は「次に開いたとき」に反映される。開いたままの画面は古い版のまま（ADR-0012 のリスク）
- `pnpm build` の途中（問題データの検証・型チェック）で失敗すると、デプロイされず前の版のまま残る
