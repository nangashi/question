// マーカー付き画像を描画して .cache/markers/ に保存する。位置が正しいかを目で確認するため（ADR-0008）
// 使い方:
//   pnpm check:markers                    確認用の画像を描画する（未確認・変更ありのものに印を付ける）
//   pnpm check:markers --approve <問題ID>  画像を見て位置が正しいことを確認した記録を残す
import { mkdirSync } from "node:fs";
import sharp from "sharp";
import { parseContent } from "../src/schema.ts";
import { loadRawContent } from "./load-content.ts";
import { loadChecks, markerHash, markerTargets, saveChecks } from "./marker-checks.ts";

const OUT = ".cache/markers";
const { content } = parseContent(loadRawContent());
const targets = markerTargets(content);
const checks = loadChecks();

const approveIndex = process.argv.indexOf("--approve");
if (approveIndex >= 0) {
  const ids = process.argv.slice(approveIndex + 1);
  if (ids.length === 0) throw new Error("--approve の後に問題 ID を指定してください");
  for (const id of ids) {
    const t = targets.find((x) => x.question.id === id);
    if (!t) throw new Error(`マーカー付きの問題が見つかりません: ${id}`);
    const hash = markerHash(t.themeId, t.media);
    if (!hash) throw new Error(`画像がありません: ${t.media.src}`);
    checks[id] = { image: `${t.themeId}/${t.media.src}`, hash };
    console.log(`確認済みとして記録: ${id}`);
  }
  saveChecks(checks);
  process.exit(0);
}

mkdirSync(OUT, { recursive: true });
for (const { question: q, themeId, media: m } of targets) {
  const hash = markerHash(themeId, m);
  if (!hash) {
    console.warn(`画像がありません: ${m.src}（pnpm fetch:images を実行してください）`);
    continue;
  }
  const img = sharp(`content/${themeId}/${m.src}`);
  const { width = 0, height = 0 } = await img.metadata();
  const r = Math.round(Math.min(width, height) * 0.035);
  const circles = m
    .markers!.map((mk) => {
      const cx = Math.round(mk.x * width);
      const cy = Math.round(mk.y * height);
      const answer = q.type === "choice" && q.answer === mk.id;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${answer ? "#2B4C7E" : "#1F2328"}" fill-opacity="0.85" stroke="#fff" stroke-width="${r / 5}"/>
<text x="${cx}" y="${cy}" font-size="${r * 1.2}" font-family="sans-serif" font-weight="bold" fill="#fff" text-anchor="middle" dominant-baseline="central">${mk.label}</text>
<text x="${cx + r * 1.3}" y="${cy}" font-size="${r * 0.7}" font-family="sans-serif" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke" dominant-baseline="central">${mk.id}</text>`;
    })
    .join("\n");
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${circles}</svg>`);
  const out = `${OUT}/${q.id}.png`;
  await img.composite([{ input: overlay }]).png().toFile(out);
  const status = checks[q.id]?.hash === hash ? "確認済み" : checks[q.id] ? "要再確認（変更あり）" : "未確認";
  console.log(`${out}  [${status}]`);
}
