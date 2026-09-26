// テスト用: content/ に、全出題形式を含むテスト用サンプル（fixtures/content/）を加える
// （拡張子付きで読み込み、差し替えの対象（"./contentFiles"）にならないようにする）
import * as real from "../contentFiles.ts";
import { relativeTo } from "../contentFiles.ts";

const FIXTURES = "/src/test/fixtures/content/";

export { relativeTo };
export const jsonFiles = {
  ...real.jsonFiles,
  ...relativeTo(FIXTURES, import.meta.glob<unknown>("/src/test/fixtures/content/**/*.json", { eager: true, import: "default" })),
};
export const assetFiles = {
  ...real.assetFiles,
  ...relativeTo(
    FIXTURES,
    import.meta.glob<string>("/src/test/fixtures/content/**/*.{jpg,jpeg,png,webp,svg}", { eager: true, query: "?url", import: "default" }),
  ),
};
export const lessonFiles = real.lessonFiles;
