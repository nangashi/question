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
];

for (const { file, out } of images) {
  if (existsSync(out)) {
    console.log(`skip ${out}`);
    continue;
  }
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1600`;
  const res = await fetch(url, { headers: { "User-Agent": "question-app/0.1 (study app; content build script)" } });
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(
    out,
    await sharp(buf).resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer(),
  );
  console.log(`saved ${out}`);
}
