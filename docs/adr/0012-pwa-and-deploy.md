# 0012. PWA は vite-plugin-pwa で作り、main への push で Cloudflare Workers にデプロイする

- ステータス: 承認（実装済み）
- 日付: 2026-09-26
- 関連: ADR-0003, ADR-0004, ADR-0005, ADR-0009

## 背景

スマホで毎日使えるかを確かめる（Phase 1 の完了条件）には、ホーム画面から開けて、電車の中などの電波が弱い場所でも使える必要がある。iOS Safari では、ホーム画面に追加していないサイトのデータは 7 日間使わないと消えることがある（ADR-0003）。配信先は Cloudflare Workers の静的アセット（ADR-0005）。

## 決定

- `vite-plugin-pwa`（Workbox の generateSW）で Service Worker とマニフェストを作る
- ビルドしたファイル（JS・CSS・問題データ・画像）をすべて事前に端末へ保存（プリキャッシュ）し、オフラインでも使えるようにする。Google Fonts は一度読み込んだものを端末に残す
- 新しい版を配信したら、次に開いたときに自動で更新する（`registerType: "autoUpdate"`）。出題中の状態は localStorage に保存しているので、更新で再読み込みされても続きから再開できる
- 起動時に `navigator.storage.persist()` で永続化を求める
- デプロイは Cloudflare の Workers Builds（GitHub 連携）で行う。`main` に push すると、Cloudflare 側で `pnpm build`（問題データの検証・型チェックを含む）と `wrangler deploy` が走る。設定は `wrangler.jsonc`

## 検討した選択肢

| 選択肢 | 長所 | 短所 |
|---|---|---|
| **vite-plugin-pwa（採用）** | 設定だけでプリキャッシュと更新の仕組みがそろう | 依存が 1 つ増える |
| Service Worker を自作する | 依存がない | キャッシュの更新・版管理を自前で書く必要がある |
| **Workers Builds（採用）** | API トークンを GitHub に置かなくてよい。Cloudflare の画面でビルドの記録を見られる | 最初に Cloudflare の画面で GitHub と連携する手作業がいる |
| GitHub Actions から `wrangler deploy` | テストと同じ場所でデプロイできる | Cloudflare の API トークンを GitHub のシークレットに置く必要がある |
| 手元から `pnpm run deploy` | 設定が最小 | push とデプロイを別に行う必要がある（手動の手段としては残す） |

## 結果

- 良い影響: ホーム画面に追加して、アプリとして使える。オフラインでも学習できる。push するだけで公開される
- 悪い影響: 画像を含めてすべてを端末に保存するため、初回の読み込みが数 MB になる → 画像が増えて大きくなったら、画像だけ使うときに保存する方式に変える
- リスク: 更新は「次に開いたとき」なので、開いたままの画面は古い版のまま → 気になる場合は、更新があることを知らせる表示を追加する
