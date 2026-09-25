// Wikimedia Commons から作品画像（パブリックドメイン）を取得し、長辺 1200px に縮小して保存する（ADR-0004）
// 使い方: pnpm fetch:images
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import sharp from "sharp";

const images: { file: string; out: string }[] = [
  { file: "La_ronda_de_noche,_por_Rembrandt_van_Rijn.jpg", out: "content/painting/images/night-watch.jpg" },
  { file: "1665_Girl_with_a_Pearl_Earring.jpg", out: "content/painting/images/pearl-earring.jpg" },
  { file: "The_Calling_of_Saint_Matthew-Caravaggo_(1599-1600).jpg", out: "content/painting/images/calling-of-matthew.jpg" },
  { file: "Las_Meninas,_by_Diego_Velázquez,_from_Prado_in_Google_Earth.jpg", out: "content/painting/images/las-meninas.jpg" },
  { file: "Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg", out: "content/painting/images/milkmaid.jpg" },
  { file: "Byodoin_Phoenix_Hall_Uji_2009.jpg", out: "content/japanese-history/images/byodoin-phoenix-hall.jpg" },
  { file: "Alexandre_Cabanel_-_The_Birth_of_Venus_-_Google_Art_Project_2.jpg", out: "content/painting/images/cabanel-birth-of-venus.jpg" },
  { file: "Boulevard_du_Temple_by_Daguerre.jpg", out: "content/painting/images/daguerre-boulevard-du-temple.jpg" },
  { file: "Monet_-_Impression,_Sunrise.jpg", out: "content/painting/images/monet-impression-sunrise.jpg" },
  { file: "Hiroshige_Van_Gogh_1.JPG", out: "content/painting/images/hiroshige-van-gogh-plum.jpg" },
  { file: "Paul_Cézanne_108.jpg", out: "content/painting/images/cezanne-sainte-victoire.jpg" },
  { file: "Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg", out: "content/painting/images/gogh-starry-night.jpg" },
  { file: "Matisse-Woman-with-a-Hat.jpg", out: "content/painting/images/matisse-woman-with-a-hat.jpg" },
  { file: "Vassily_Kandinsky,_1913_-_Composition_7.jpg", out: "content/painting/images/kandinsky-composition-7.jpg" },
  { file: "Kazimir_Malevich,_1915,_Black_Suprematic_Square,_oil_on_linen_canvas,_79.5_x_79.5_cm,_Tretyakov_Gallery,_Moscow.jpg", out: "content/painting/images/malevich-black-square.jpg" },
  { file: "Piet_Mondriaan,_1930_-_Mondrian_Composition_II_in_Red,_Blue,_and_Yellow.jpg", out: "content/painting/images/mondrian-composition-1930.jpg" },
  { file: "Spas_vsederzhitel_sinay.jpg", out: "content/painting/images/icon-christ-pantocrator-sinai.jpg" },
  { file: "Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg", out: "content/painting/images/botticelli-birth-of-venus.jpg" },
  { file: "Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg", out: "content/painting/images/leonardo-mona-lisa.jpg" },
  { file: "Eugène_Delacroix_-_Le_28_Juillet._La_Liberté_guidant_le_peuple.jpg", out: "content/painting/images/delacroix-liberty.jpg" },
  { file: "Gustave_Courbet_-_The_Stonebreakers_-_WGA05457.jpg", out: "content/painting/images/courbet-stonebreakers.jpg" },
];

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
for (const { file, out } of images) {
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

if (failed.length > 0) {
  console.error(`\n${failed.length} 枚を取得できませんでした（時間をおいて再実行すると、取得済みのものは飛ばして続きから取得します）:`);
  for (const f of failed) console.error(`  - ${f}`);
  process.exit(1);
}
