// マーカー付き画像を描画して .cache/markers/ に保存する。位置が正しいかを目で確認するため（ADR-0008）
// 使い方: pnpm check:markers
import { existsSync, mkdirSync } from "node:fs";
import sharp from "sharp";
import { parseContent } from "../src/schema.ts";
import { loadRawContent } from "./load-content.ts";

const OUT = ".cache/markers";
mkdirSync(OUT, { recursive: true });
const { content } = parseContent(loadRawContent());

for (const [key, c] of content.categories) {
  const themeId = key.split("/")[0]!;
  for (const q of c.questions) {
    for (const m of q.media ?? []) {
      if (!m.markers) continue;
      const src = `content/${themeId}/${m.src}`;
      if (!existsSync(src)) {
        console.warn(`画像がありません: ${src}（pnpm fetch:images を実行してください）`);
        continue;
      }
      const img = sharp(src);
      const { width = 0, height = 0 } = await img.metadata();
      const r = Math.round(Math.min(width, height) * 0.035);
      const circles = m.markers
        .map((mk) => {
          const cx = Math.round(mk.x * width);
          const cy = Math.round(mk.y * height);
          const answer = "answer" in q && q.answer === mk.id;
          return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${answer ? "#2B4C7E" : "#1F2328"}" fill-opacity="0.85" stroke="#fff" stroke-width="${r / 5}"/>
<text x="${cx}" y="${cy}" font-size="${r * 1.2}" font-family="sans-serif" font-weight="bold" fill="#fff" text-anchor="middle" dominant-baseline="central">${mk.label}</text>
<text x="${cx + r * 1.3}" y="${cy}" font-size="${r * 0.7}" font-family="sans-serif" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke" dominant-baseline="central">${mk.id}</text>`;
        })
        .join("\n");
      const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${circles}</svg>`);
      const out = `${OUT}/${q.id}.png`;
      await img.composite([{ input: overlay }]).png().toFile(out);
      console.log(`${out}`);
    }
  }
}
