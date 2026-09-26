import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [preact()],
  test: {
    // テストでは IndexedDB の代わりにメモリ上の実装を使う
    setupFiles: ["fake-indexeddb/auto"],
    // 問題データに、全出題形式を含むテスト用サンプル（src/test/fixtures/content/）を加える
    alias: [{ find: /^\.\/contentFiles$/, replacement: fileURLToPath(new URL("./src/test/contentFiles.ts", import.meta.url)) }],
  },
});
