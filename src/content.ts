// content/ をビルド時に取り込み、検証して提供する
import { parseContent, type CategoryContent, type Item, type Media, type Question, type RawContent } from "./schema";

const jsonFiles = import.meta.glob<unknown>("/content/**/*.json", { eager: true, import: "default" });
const assetFiles = import.meta.glob<string>("/content/**/*.{jpg,jpeg,png,webp,svg}", {
  eager: true,
  query: "?url",
  import: "default",
});

const lessonFiles = import.meta.glob<string>(["/content/**/*.md", "!/content/**/*.notes.md"], {
  eager: true,
  query: "?raw",
  import: "default",
});

const raw: RawContent = { themes: {}, categories: {}, maps: {}, assets: new Set(), lessons: {} };
for (const [path, md] of Object.entries(lessonFiles)) {
  const [top, name] = path.replace("/content/", "").split("/");
  if (top && name) raw.lessons[`${top}/${name.replace(/\.md$/, "")}`] = md;
}
for (const [path, json] of Object.entries(jsonFiles)) {
  const [top, name] = path.replace("/content/", "").split("/");
  if (!top || !name) continue;
  if (top === "_maps") raw.maps[name.replace(/\.json$/, "")] = json;
  else if (name === "_theme.json") raw.themes[top] = json;
  else raw.categories[`${top}/${name.replace(/\.json$/, "")}`] = json;
}
const assetUrls = new Map<string, string>();
for (const [path, url] of Object.entries(assetFiles)) {
  const rel = path.replace("/content/", "");
  raw.assets.add(rel);
  assetUrls.set(rel, url);
}

export const { content, errors: contentErrors } = parseContent(raw);

export type CategoryRef = { themeId: string; categoryId: string; key: string };

const itemIndex = new Map<string, { item: Item; ref: CategoryRef }>();
const questionIndex = new Map<string, { question: Question; ref: CategoryRef }>();
for (const [key, c] of content.categories) {
  const [themeId, categoryId] = key.split("/") as [string, string];
  const ref = { themeId, categoryId, key };
  c.items.forEach((item) => itemIndex.set(item.id, { item, ref }));
  c.questions.forEach((question) => questionIndex.set(question.id, { question, ref }));
}

export const getItem = (id: string) => itemIndex.get(id);
export const getQuestion = (id: string) => questionIndex.get(id);
export const getTheme = (id: string) => content.themes.find((t) => t.id === id);
export const getCategory = (themeId: string, categoryId: string): CategoryContent | undefined =>
  content.categories.get(`${themeId}/${categoryId}`);

/** サブカテゴリの年代の範囲。period があればそれを、なければ知識カードの年から求める */
export function yearRange(themeId: string, categoryId: string): [number, number] | undefined {
  const period = getTheme(themeId)?.categories.find((c) => c.id === categoryId)?.period;
  if (period) return period;
  const years = (getCategory(themeId, categoryId)?.items ?? []).flatMap((it) =>
    it.year ? [it.year.from, it.year.to ?? it.year.from] : [],
  );
  return years.length > 0 ? [Math.min(...years), Math.max(...years)] : undefined;
}

export const getLesson = (themeId: string, categoryId: string) => content.lessons.get(`${themeId}/${categoryId}`);

/** 知識カードを含む読み物の節 */
export function sectionOfItem(itemId: string) {
  const ref = itemIndex.get(itemId)?.ref;
  if (!ref) return undefined;
  const lesson = content.lessons.get(ref.key);
  const section = lesson?.sections.find((s) => s.itemIds.includes(itemId));
  return section && { ref, section, total: lesson!.sections.length };
}

/** media の src（テーマからの相対パス）を URL に変換。画像がなければ undefined */
export function mediaUrl(themeId: string, m: Media): string | undefined {
  return assetUrls.get(`${themeId}/${m.src}`);
}

export function activeQuestions(filter: (ref: CategoryRef) => boolean = () => true): Question[] {
  return [...questionIndex.values()].filter((q) => q.question.status === "active" && filter(q.ref)).map((q) => q.question);
}

/** 問題を参照している知識カード（先頭）のカテゴリ */
export const questionRef = (q: Question) => questionIndex.get(q.id)!.ref;
