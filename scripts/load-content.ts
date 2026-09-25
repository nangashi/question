// content/ を読み込み、parseContent に渡せる形にする（Node 用）
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { RawContent } from "../src/schema.ts";

const ROOT = "content";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

export function loadRawContent(): RawContent {
  const raw: RawContent = { themes: {}, categories: {}, maps: {}, assets: new Set(), lessons: {} };
  for (const file of walk(ROOT)) {
    const rel = relative(ROOT, file).replaceAll("\\", "/");
    const [top, name] = rel.split("/");
    if (!name) continue;
    if (top === "_maps" && name.endsWith(".json")) raw.maps[name.replace(/\.json$/, "")] = JSON.parse(readFileSync(file, "utf8"));
    else if (name === "_theme.json") raw.themes[top!] = JSON.parse(readFileSync(file, "utf8"));
    else if (name.endsWith(".json")) raw.categories[`${top}/${name.replace(/\.json$/, "")}`] = JSON.parse(readFileSync(file, "utf8"));
    else if (name.endsWith(".notes.md")) continue;
    else if (name.endsWith(".md")) raw.lessons[`${top}/${name.replace(/\.md$/, "")}`] = readFileSync(file, "utf8");
    else raw.assets.add(rel);
  }
  return raw;
}
