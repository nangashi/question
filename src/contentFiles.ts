// content/ のファイルをビルド時に取り込む。キーは content/ からの相対パス
// テストでは、テスト用サンプルを加えたもの（src/test/contentFiles.ts）に差し替える（vite.config.ts）

/** import.meta.glob の結果のキーから、先頭の prefix を取り除く */
export function relativeTo<T>(prefix: string, files: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(files).map(([path, v]) => [path.replace(prefix, ""), v]));
}

export const jsonFiles = relativeTo("/content/", import.meta.glob<unknown>("/content/**/*.json", { eager: true, import: "default" }));
export const assetFiles = relativeTo(
  "/content/",
  import.meta.glob<string>("/content/**/*.{jpg,jpeg,png,webp,svg}", { eager: true, query: "?url", import: "default" }),
);
export const lessonFiles = relativeTo(
  "/content/",
  import.meta.glob<string>(["/content/**/*.md", "!/content/**/*.notes.md"], { eager: true, query: "?raw", import: "default" }),
);
