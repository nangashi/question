// マーカー位置の目視確認の記録（ADR-0008）
// 確認した時点の「画像 + マーカー座標」のハッシュを content/_marker-checks.json に保存し、
// 画像やマーカーが変わったら確認し直すよう検証で検出する
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { Media, ParsedContent, Question } from "../src/schema.ts";

export const CHECKS_FILE = "content/_marker-checks.json";

export type MarkerCheck = { image: string; hash: string };
export type MarkerChecks = Record<string, MarkerCheck>; // 問題 ID -> 確認記録

export function loadChecks(): MarkerChecks {
  return existsSync(CHECKS_FILE) ? (JSON.parse(readFileSync(CHECKS_FILE, "utf8")) as MarkerChecks) : {};
}

export function saveChecks(checks: MarkerChecks): void {
  const sorted = Object.fromEntries(Object.entries(checks).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(CHECKS_FILE, JSON.stringify(sorted, null, 2) + "\n");
}

/** 画像ファイルとマーカー座標から確認用のハッシュを作る。画像がなければ undefined */
export function markerHash(themeId: string, media: Media): string | undefined {
  const path = `content/${themeId}/${media.src}`;
  if (!existsSync(path)) return undefined;
  return createHash("sha256")
    .update(readFileSync(path))
    .update(JSON.stringify(media.markers))
    .digest("hex")
    .slice(0, 16);
}

export type MarkerTarget = { question: Question; themeId: string; media: Media };

export function markerTargets(content: ParsedContent): MarkerTarget[] {
  const out: MarkerTarget[] = [];
  for (const [key, c] of content.categories)
    for (const question of c.questions)
      for (const media of question.media ?? [])
        if (media.markers) out.push({ question, themeId: key.split("/")[0]!, media });
  return out;
}

/** 確認されていない（または確認後に変わった）マーカーのエラー一覧 */
export function uncheckedMarkerErrors(content: ParsedContent, checks: MarkerChecks): string[] {
  return markerTargets(content).flatMap(({ question, themeId, media }) => {
    const hash = markerHash(themeId, media);
    if (hash === undefined) return []; // 画像がないことは別のエラーで出る
    const check = checks[question.id];
    if (check?.hash === hash) return [];
    return [
      `${question.id}: マーカーが${check ? "確認後に変更された" : "未確認"}。pnpm check:markers で画像を見て確認し、pnpm check:markers --approve ${question.id}`,
    ];
  });
}
