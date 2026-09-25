// サブカテゴリの知識カードと問題を、人が読みやすいレビュー用の Markdown にする
// 使い方: pnpm review <theme>/<category>
//   出力: .cache/reviews/<theme>-<category>.md
//   content/<theme>/<category>.notes.md（生成時の確認メモ）があれば末尾に含める
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { askLabel, askSchema, coverageWarnings, parseContent, type Entry, type Item, type Question } from "../src/schema.ts";
import { loadRawContent } from "./load-content.ts";
import { loadChecks, uncheckedMarkerErrors } from "./marker-checks.ts";

const key = process.argv[2];
if (!key || !key.includes("/")) throw new Error("使い方: pnpm review <theme>/<category>");
const [themeId, categoryId] = key.split("/") as [string, string];

const { content, errors } = parseContent(loadRawContent());
errors.push(...uncheckedMarkerErrors(content, loadChecks()));
const theme = content.themes.find((t) => t.id === themeId);
const cat = theme?.categories.find((c) => c.id === categoryId);
const data = content.categories.get(key);
if (!theme || !cat || !data) throw new Error(`サブカテゴリが見つかりません: ${key}`);

const itemTitle = (id: string) => {
  for (const c of content.categories.values()) {
    const it = c.items.find((x) => x.id === id);
    if (it) return it.title;
  }
  return `（不明: ${id}）`;
};
const text = (e: Entry) => e.text ?? `［画像: ${e.media?.src}］`;
const yearText = (it: Item) =>
  it.year ? `${it.year.from}${it.year.to ? `〜${it.year.to}` : ""}年${it.year.approx ? "ごろ" : ""}` : "年なし";

function answerBlock(q: Question): string[] {
  switch (q.type) {
    case "choice":
      return q.choices.map((c) => `- ${c.id === q.answer ? "✅" : "▫️"} ${text(c)}`);
    case "order":
      return q.answer.map((id, i) => `${i + 1}. ${text(q.entries.find((e) => e.id === id)!)}`);
    case "match":
      return q.pairs.map(([l, r]) => `- ${text(q.left.find((e) => e.id === l)!)} — ${text(q.right.find((e) => e.id === r)!)}`);
    case "classify":
      return q.buckets.map((b) => `- **${text(b)}**: ${q.entries.filter((e) => e.bucket === b.id).map(text).join("、")}`);
    case "year":
      return [`- 正解: ${q.answer}年（許容 ±${q.tolerance}年）`];
    case "map": {
      const region = content.maps.get(q.map)?.regions.find((r) => r.id === q.answer);
      return [`- 正解: ${region?.name ?? q.answer}（地図: ${q.map}）`];
    }
  }
}

const out: string[] = [];
out.push(`# レビュー: ${theme.name} > ${cat.name}`, "");
if (cat.description) out.push(`> ${cat.description}`, "");
out.push(`知識カード ${data.items.length} 枚 / 問題 ${data.questions.length} 問`, "");
out.push(errors.length === 0 ? "検証: OK" : `検証エラー ${errors.length} 件:\n${errors.map((e) => `- ${e}`).join("\n")}`, "");

// 問いの網羅状況: 知識カードごとに、何を問う問題が何問あるか
const asks = askSchema.options;
out.push("## 問いの網羅状況", "");
out.push(`| 知識カード | ${asks.map((a) => askLabel[a]).join(" | ")} | 計 |`, `|---|${asks.map(() => "---").join("|")}|---|`);
for (const it of [...data.items].sort((a, b) => a.unlockOrder - b.unlockOrder)) {
  const qs = data.questions.filter((q) => q.status === "active" && q.itemIds.includes(it.id));
  const cells = asks.map((a) => {
    const n = qs.filter((q) => q.asks.includes(a)).length;
    return n > 0 ? String(n) : a === "why" && it.why ? "**0**" : "";
  });
  out.push(`| ${it.title} | ${cells.join(" | ")} | ${qs.length} |`);
}
const warns = coverageWarnings(content).filter((w) => w.startsWith(`${key}/`));
out.push("", warns.length === 0 ? "抜けの警告: なし" : `抜けの警告 ${warns.length} 件（**0** は why があるのに「なぜ」を問う問題がないもの）`, "");

out.push("## 知識カード", "");
for (const it of [...data.items].sort((a, b) => a.unlockOrder - b.unlockOrder)) {
  out.push(`### ${it.unlockOrder + 1}. ${it.title}（${yearText(it)}）`, "");
  out.push(`\`${it.id}\`${it.place ? ` ・ ${it.place.name}` : ""}${it.people?.length ? ` ・ ${it.people.join("、")}` : ""}`, "");
  out.push(`- **概要**: ${it.summary}`);
  if (it.why) out.push(`- **なぜ**: ${it.why}`);
  for (const l of it.links ?? []) out.push(`- **つながり（${l.axis}）**: ${l.text} → ${l.itemIds.map(itemTitle).join("、")}`);
  if (it.trivia) out.push(`- **へぇ**: ${it.trivia}`);
  out.push(`- **出典**: ${it.sources.join(" ／ ")}`);
  const qs = data.questions.filter((q) => q.itemIds.includes(it.id)).map((q) => q.id);
  out.push(`- **問題**: ${qs.length > 0 ? qs.map((id) => `\`${id}\``).join("、") : "なし"}`, "");
}

out.push("## 問題", "");
const counts = new Map<string, number>();
data.questions.forEach((q) => counts.set(q.type, (counts.get(q.type) ?? 0) + 1));
out.push(`形式: ${[...counts].map(([t, n]) => `${t} ${n}`).join(" ／ ")}`, "");
data.questions.forEach((q, i) => {
  out.push(`### Q${i + 1}. [${q.type}] ${q.prompt}`, "");
  out.push(`\`${q.id}\` ・ 問うこと: ${q.asks.map((a) => askLabel[a]).join("・")} ・ 知識カード: ${q.itemIds.map(itemTitle).join("、")}${q.status === "retired" ? " ・ **retired**" : ""}`, "");
  if (q.media?.length) out.push(`画像: ${q.media.map((m) => `${m.src}${m.markers ? `（マーカー ${m.markers.length}）` : ""}`).join("、")}`, "");
  out.push(...answerBlock(q), "");
  out.push(`**解説**: ${q.explanation}`, "");
});

const notes = `content/${themeId}/${categoryId}.notes.md`;
if (existsSync(notes)) out.push("## 確認メモ（生成時）", "", readFileSync(notes, "utf8"));

mkdirSync(".cache/reviews", { recursive: true });
const path = `.cache/reviews/${themeId}-${categoryId}.md`;
writeFileSync(path, out.join("\n") + "\n");
console.log(path);
