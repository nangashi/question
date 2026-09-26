// Wikimedia Commons から作品画像（パブリックドメイン）を取得し、長辺 1200px に縮小して保存する（ADR-0004）
// 使い方: pnpm fetch:images
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import sharp from "sharp";
import { allMedia, parseContent } from "../src/schema.ts";
import { loadRawContent } from "./load-content.ts";

// 取得する画像は、問題データの media から集める（sourceUrl が Commons のファイルページのもの）
const COMMONS_FILE = /^https:\/\/commons\.wikimedia\.org\/wiki\/File:(.+)$/;
const images = new Map<string, string>(); // 保存先 -> Commons のファイル名
const noSource: string[] = [];
for (const { themeId, media } of allMedia(parseContent(loadRawContent()).content)) {
  if (media.kind !== "image") continue;
  const out = `content/${themeId}/${media.src}`;
  const file = media.sourceUrl?.match(COMMONS_FILE)?.[1];
  if (file) images.set(out, decodeURIComponent(file));
  else if (!existsSync(out)) noSource.push(out);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ATTEMPTS = 5;

/** fetch の失敗理由を取り出す（接続エラーは AggregateError の中に入っている） */
function reason(e: unknown): string {
  const cause = e instanceof Error ? (e.cause as { code?: string; message?: string; errors?: { code?: string }[] } | undefined) : undefined;
  const code = cause?.code ?? cause?.errors?.map((x) => x.code).join(",");
  return [e instanceof Error ? e.message : String(e), code || cause?.message].filter(Boolean).join(" / ");
}

/** 取得に失敗したら、間隔を空けて再試行する */
async function download(file: string): Promise<Buffer> {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1600`;
  let lastError: unknown;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "question-app/0.1 (study app; content build script)" },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      lastError = e;
      console.warn(`  失敗 ${attempt}/${ATTEMPTS}: ${reason(e)}`);
      if (attempt < ATTEMPTS) await sleep(5_000 * attempt);
    }
  }
  throw lastError;
}

const failed: string[] = [];
for (const [out, file] of images) {
  if (existsSync(out)) {
    console.log(`skip ${out}`);
    continue;
  }
  console.log(`get  ${out}`);
  try {
    const buf = await download(file);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(
      out,
      await sharp(buf).resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer(),
    );
    console.log(`saved ${out}`);
  } catch {
    failed.push(out);
  }
  // Wikimedia に負荷をかけないよう、1 枚ごとに間を空ける
  await sleep(1_000);
}

if (noSource.length > 0) {
  console.error(`\n${noSource.length} 枚は sourceUrl が Commons のファイルページ（https://commons.wikimedia.org/wiki/File:...）でないため取得できません:`);
  for (const f of noSource) console.error(`  - ${f}`);
}
if (failed.length > 0) {
  console.error(`\n${failed.length} 枚を取得できませんでした（時間をおいて再実行すると、取得済みのものは飛ばして続きから取得します）:`);
  for (const f of failed) console.error(`  - ${f}`);
}
if (noSource.length > 0 || failed.length > 0) process.exit(1);
