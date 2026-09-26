import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [
    preact(),
    // PWA（ADR-0012）: ホーム画面に追加でき、問題データと画像をすべて端末に保存してオフラインでも使える
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png", "icon.svg"],
      manifest: {
        name: "まなびカード",
        short_name: "まなびカード",
        description: "読んで、解いて、忘れる前に復習する学習カード",
        lang: "ja",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#f7f5f0",
        theme_color: "#f7f5f0",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,webp,json}"],
        // Google Fonts は初回に読み込んだものを端末に残す
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-css" },
          },
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    // テストでは IndexedDB の代わりにメモリ上の実装を使う
    setupFiles: ["fake-indexeddb/auto"],
    // 問題データに、全出題形式を含むテスト用サンプル（src/test/fixtures/content/）を加える
    alias: [{ find: /^\.\/contentFiles$/, replacement: fileURLToPath(new URL("./src/test/contentFiles.ts", import.meta.url)) }],
  },
});
