// Natural Earth（パブリックドメイン）から日本の都道府県地図を作る（ADR-0008）
// 使い方: pnpm build:map
// 元データ: https://github.com/nvkelso/natural-earth-vector の ne_10m_admin_1_states_provinces.geojson
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { geoArea, geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";

const SRC_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson";
const SRC = ".cache/ne_admin1.geojson";
const SIMPLIFIED = ".cache/jp.geojson";
const OUT = "content/_maps/japan-prefectures.json";
const W = 1000;
const H = 1000;

if (!existsSync(SRC)) {
  mkdirSync(".cache", { recursive: true });
  execFileSync("curl", ["-sSL", "-o", SRC, SRC_URL], { stdio: "inherit" });
}
// 小笠原・南鳥島などの遠隔の島は除き、形を簡略化する
execFileSync(
  "pnpm",
  ["exec", "mapshaper", SRC, "-filter", 'adm0_a3=="JPN"', "-clip", "bbox=122,24,149,46", "-simplify", "12%", "keep-shapes",
   "-filter-islands", "min-area=15km2", "-o", SIMPLIFIED, "format=geojson", "force"],
  { stdio: "inherit" },
);

type Feature = { type: "Feature"; properties: Record<string, string>; geometry: unknown };
const fc = JSON.parse(readFileSync(SIMPLIFIED, "utf8")) as { features: Feature[] };

// d3-geo は外周が時計回りの前提。逆向き（面積が半球を超える）の多角形は向きを反転する
type Ring = number[][];
const rewind = (polygon: Ring[]): Ring[] =>
  geoArea({ type: "Polygon", coordinates: polygon } as GeoPermissibleObjects) > 2 * Math.PI
    ? polygon.map((ring) => [...ring].reverse())
    : polygon;
for (const f of fc.features) {
  const g = f.geometry as { type: string; coordinates: Ring[] | Ring[][] };
  g.coordinates =
    g.type === "Polygon" ? rewind(g.coordinates as Ring[]) : (g.coordinates as Ring[][]).map(rewind);
}
const isOkinawa = (f: Feature) => f.properties.iso_3166_2 === "JP-47";
const main = { type: "FeatureCollection", features: fc.features.filter((f) => !isOkinawa(f)) };
const okinawa = { type: "FeatureCollection", features: fc.features.filter(isOkinawa) };

// 本土は全体に、沖縄は左上の枠（日本地図でよく使う配置）に描く
const mainProj = geoMercator().fitExtent([[40, 20], [W - 20, H - 20]], main as GeoPermissibleObjects);
const okiProj = geoMercator().fitExtent([[30, 40], [300, 260]], okinawa as GeoPermissibleObjects);
const round = (d: string) => d.replace(/\d+\.\d+/g, (n) => Number(n).toFixed(1));

const regions = fc.features
  .map((f) => {
    const proj = isOkinawa(f) ? okiProj : mainProj;
    return {
      id: f.properties.iso_3166_2!.replace("JP-", "jp-"),
      name: f.properties.name_ja!,
      d: round(geoPath(proj)(f as GeoPermissibleObjects) ?? ""),
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

writeFileSync(
  OUT,
  JSON.stringify(
    {
      id: "japan-prefectures",
      name: "日本（都道府県）",
      viewBox: `0 0 ${W} ${H}`,
      credit: "Made with Natural Earth",
      license: "Public Domain",
      sourceUrl: "https://www.naturalearthdata.com/",
      regions,
    },
    null,
    1,
  ) + "\n",
);
console.log(`${OUT}: ${regions.length} regions`);
