// content/ のスキーマ検証と参照整合性チェック（ADR-0008）
// 使い方: pnpm validate
import { coverageWarnings, parseContent } from "../src/schema.ts";
import { loadRawContent } from "./load-content.ts";
import { loadChecks, uncheckedMarkerErrors } from "./marker-checks.ts";

const { content, errors } = parseContent(loadRawContent());
errors.push(...uncheckedMarkerErrors(content, loadChecks()));
let items = 0;
let questions = 0;
for (const c of content.categories.values()) {
  items += c.items.length;
  questions += c.questions.length;
}
console.log(`テーマ ${content.themes.length} / サブカテゴリ ${content.categories.size} / 知識カード ${items} / 問題 ${questions} / 地図 ${content.maps.size}`);
const warnings = coverageWarnings(content);
if (warnings.length > 0) {
  console.warn(`\n${warnings.length} 件の警告（問いの抜け。pnpm review で詳細を確認）:`);
  for (const w of warnings) console.warn(`  - ${w}`);
}
if (errors.length > 0) {
  console.error(`\n${errors.length} 件のエラー:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("OK");
