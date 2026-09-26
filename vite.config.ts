import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  test: {
    // テストでは IndexedDB の代わりにメモリ上の実装を使う
    setupFiles: ["fake-indexeddb/auto"],
  },
});
