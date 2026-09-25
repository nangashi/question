// 問題データのスキーマ（ADR-0008）
import { z } from "zod";
import { parseLesson, type Lesson } from "./lesson.ts";

const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "ID は英小文字・数字・ハイフンのみ");

export const markerSchema = z.object({
  id,
  label: z.string().min(1),
  // 画像サイズに対する 0〜1 の比率
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const mediaSchema = z.object({
  kind: z.enum(["image", "svg", "mermaid"]),
  // テーマのディレクトリからの相対パス（例: images/night-watch.jpg）
  src: z.string().min(1),
  alt: z.string().min(1),
  credit: z.string().optional(),
  license: z.string().optional(),
  sourceUrl: z.url().optional(),
  // 部分指定用のマーカー。3〜4 個まで（docs/content-guide.md）
  markers: z.array(markerSchema).min(2).max(4).optional(),
});

export const linkAxisSchema = z.enum(["時代", "地理", "因果", "人物", "比較"]);

export const itemSchema = z.object({
  id,
  title: z.string().min(1),
  summary: z.string().min(1),
  // なぜ: 目的・背景・原因（docs/content-guide.md）
  why: z.string().min(1).optional(),
  year: z
    .object({ from: z.number().int(), to: z.number().int().optional(), approx: z.boolean().optional() })
    .optional(),
  place: z.object({ name: z.string().min(1), region: z.string().optional() }).optional(),
  people: z.array(z.string()).optional(),
  tags: z.array(z.string()),
  media: z.array(mediaSchema).optional(),
  links: z
    .array(z.object({ axis: linkAxisSchema, text: z.string().min(1), itemIds: z.array(id).min(1) }))
    .max(3)
    .optional(),
  trivia: z.string().optional(),
  asOf: z.string().optional(),
  sources: z.array(z.string().min(1)).min(1),
  unlockOrder: z.number().int().nonnegative(),
});

export const entrySchema = z
  .object({ id, text: z.string().min(1).optional(), media: mediaSchema.optional() })
  .refine((e) => e.text !== undefined || e.media !== undefined, "text か media のどちらかが必要");

/** 問題が知識カードの何を問うか（docs/content-guide.md） */
export const askSchema = z.enum(["what", "who", "when", "where", "why", "result"]);
export type Ask = z.infer<typeof askSchema>;
export const askLabel: Record<Ask, string> = {
  what: "何",
  who: "誰",
  when: "いつ",
  where: "どこ",
  why: "なぜ",
  result: "結果",
};

const questionBase = {
  id,
  itemIds: z.array(id).min(1),
  asks: z.array(askSchema).min(1),
  prompt: z.string().min(1),
  media: z.array(mediaSchema).optional(),
  explanation: z.string().min(1),
  status: z.enum(["active", "retired"]),
};

export const questionSchema = z.discriminatedUnion("type", [
  z.object({ ...questionBase, type: z.literal("choice"), choices: z.array(entrySchema).min(2).max(6), answer: id }),
  z.object({ ...questionBase, type: z.literal("order"), entries: z.array(entrySchema).min(3).max(6), answer: z.array(id) }),
  z.object({
    ...questionBase,
    type: z.literal("match"),
    left: z.array(entrySchema).min(2).max(5),
    right: z.array(entrySchema).min(2).max(5),
    pairs: z.array(z.tuple([id, id])).min(2),
  }),
  z.object({
    ...questionBase,
    type: z.literal("classify"),
    buckets: z.array(entrySchema).min(2).max(4),
    entries: z.array(entrySchema.and(z.object({ bucket: id }))).min(3).max(8),
  }),
  z.object({ ...questionBase, type: z.literal("year"), answer: z.number().int(), tolerance: z.number().int().positive() }),
  z.object({ ...questionBase, type: z.literal("map"), map: id, answer: z.string().min(1) }),
]);

export const categoryContentSchema = z.object({
  items: z.array(itemSchema),
  questions: z.array(questionSchema),
});

export const themeSchema = z.object({
  id,
  name: z.string().min(1),
  categories: z
    .array(
      z.object({
        id,
        name: z.string().min(1),
        // サブカテゴリを貫く問い（docs/content-guide.md）
        description: z.string().min(1).optional(),
        period: z.tuple([z.number().int(), z.number().int()]).optional(),
      }),
    )
    .min(1),
});

export const mapSchema = z.object({
  id,
  name: z.string().min(1),
  viewBox: z.string(),
  credit: z.string().min(1),
  license: z.string().min(1),
  sourceUrl: z.url(),
  regions: z.array(z.object({ id: z.string().min(1), name: z.string().min(1), d: z.string().min(1) })).min(1),
});

export type Marker = z.infer<typeof markerSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Entry = z.infer<typeof entrySchema>;
export type Question = z.infer<typeof questionSchema>;
export type QuestionType = Question["type"];
export type CategoryContent = z.infer<typeof categoryContentSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type GeoMap = z.infer<typeof mapSchema>;

export type RawContent = {
  themes: Record<string, unknown>; // themeId -> _theme.json
  categories: Record<string, unknown>; // "themeId/categoryId" -> <category>.json
  maps: Record<string, unknown>; // mapId -> map json
  assets: Set<string>; // "themeId/images/..." の存在するファイル
  lessons: Record<string, string>; // "themeId/categoryId" -> 読み物の Markdown（ADR-0010）
};

export type ParsedContent = {
  themes: Theme[];
  categories: Map<string, CategoryContent>; // "themeId/categoryId"
  maps: Map<string, GeoMap>;
  lessons: Map<string, Lesson>; // "themeId/categoryId"
};

/** スキーマ検証と ID の参照整合性チェック。エラーがあれば一覧を返す */
export function parseContent(raw: RawContent): { content: ParsedContent; errors: string[] } {
  const errors: string[] = [];
  const themes: Theme[] = [];
  const categories = new Map<string, CategoryContent>();
  const maps = new Map<string, GeoMap>();
  const lessons = new Map<string, Lesson>();

  const report = (where: string, e: z.ZodError) =>
    e.issues.forEach((i) => errors.push(`${where}: ${i.path.join(".")} ${i.message}`));

  for (const [mapId, json] of Object.entries(raw.maps)) {
    const r = mapSchema.safeParse(json);
    if (r.success) maps.set(mapId, r.data);
    else report(`_maps/${mapId}`, r.error);
  }
  for (const [themeId, json] of Object.entries(raw.themes)) {
    const r = themeSchema.safeParse(json);
    if (!r.success) {
      report(`${themeId}/_theme`, r.error);
      continue;
    }
    if (r.data.id !== themeId) errors.push(`${themeId}/_theme: id がディレクトリ名と一致しない`);
    themes.push(r.data);
  }
  for (const [key, json] of Object.entries(raw.categories)) {
    const r = categoryContentSchema.safeParse(json);
    if (r.success) categories.set(key, r.data);
    else report(key, r.error);
  }

  // 参照整合性
  const itemIds = new Map<string, string>();
  const questionIds = new Set<string>();
  for (const [key, c] of categories) {
    const [themeId, categoryId] = key.split("/");
    const theme = themes.find((t) => t.id === themeId);
    if (!theme?.categories.some((cat) => cat.id === categoryId))
      errors.push(`${key}: _theme.json に定義されていないサブカテゴリ`);
    for (const it of c.items) {
      if (itemIds.has(it.id)) errors.push(`${key}: 知識カード ID の重複 ${it.id}`);
      itemIds.set(it.id, key);
    }
    for (const q of c.questions) {
      if (questionIds.has(q.id)) errors.push(`${key}: 問題 ID の重複 ${q.id}`);
      questionIds.add(q.id);
    }
  }
  const checkMedia = (where: string, themeId: string, m: Media | undefined) => {
    if (!m || m.kind !== "image") return;
    if (!raw.assets.has(`${themeId}/${m.src}`)) errors.push(`${where}: 画像が見つからない ${m.src}`);
  };
  for (const [key, c] of categories) {
    const themeId = key.split("/")[0]!;
    for (const it of c.items) {
      for (const l of it.links ?? [])
        for (const ref of l.itemIds)
          if (!itemIds.has(ref)) errors.push(`${key}: ${it.id} のつながり先が存在しない ${ref}`);
      it.media?.forEach((m) => checkMedia(`${key}/${it.id}`, themeId, m));
    }
    for (const q of c.questions) {
      const w = `${key}/${q.id}`;
      for (const ref of q.itemIds) if (!itemIds.has(ref)) errors.push(`${w}: 知識カードが存在しない ${ref}`);
      q.media?.forEach((m) => checkMedia(w, themeId, m));
      errors.push(...checkQuestion(w, q, maps));
      const entries =
        q.type === "choice" ? q.choices : q.type === "order" ? q.entries : q.type === "match" ? [...q.left, ...q.right] : q.type === "classify" ? [...q.buckets, ...q.entries] : [];
      entries.forEach((e) => checkMedia(w, themeId, e.media));
    }
  }
  // 読み物（ADR-0010）
  for (const [key, md] of Object.entries(raw.lessons)) {
    if (!categories.has(key)) errors.push(`${key}.md: 対応する問題データ（${key}.json）がない`);
    const { lesson, errors: lessonErrors } = parseLesson(md);
    lessonErrors.forEach((e) => errors.push(`${key}.md: ${e}`));
    for (const s of lesson.sections)
      for (const ref of s.itemIds) if (!itemIds.has(ref)) errors.push(`${key}.md: 節「${s.title}」の知識カードが存在しない ${ref}`);
    lessons.set(key, lesson);
  }
  return { content: { themes, categories, maps, lessons }, errors };
}

/**
 * 問いの抜けの警告（エラーにはしない）。
 * - 問題が 1 つもない知識カード
 * - why があるのに「なぜ」を問う問題がない知識カード
 */
export function coverageWarnings(content: ParsedContent): string[] {
  const warnings: string[] = [];
  for (const [key, c] of content.categories) {
    const lesson = content.lessons.get(key);
    const inLesson = new Set(lesson?.sections.flatMap((s) => s.itemIds));
    for (const it of c.items) {
      if (lesson && !inLesson.has(it.id)) warnings.push(`${key}/${it.id}: 読み物のどの節にも含まれていない`);
      const qs = c.questions.filter((q) => q.status === "active" && q.itemIds.includes(it.id));
      if (qs.length === 0) warnings.push(`${key}/${it.id}: 問題がない`);
      else if (it.why && !qs.some((q) => q.asks.includes("why")))
        warnings.push(`${key}/${it.id}: 「なぜ」を問う問題がない`);
    }
  }
  return warnings;
}

/** マーカー同士の最小距離（画像サイズに対する比率） */
export const MIN_MARKER_DISTANCE = 0.1;

function dupIds(list: { id: string }[]): string[] {
  const seen = new Set<string>();
  return list.filter((e) => (seen.has(e.id) ? true : (seen.add(e.id), false))).map((e) => e.id);
}

function checkQuestion(w: string, q: Question, maps: Map<string, GeoMap>): string[] {
  const errs: string[] = [];
  const ids = (l: { id: string }[]) => new Set(l.map((e) => e.id));
  switch (q.type) {
    case "choice": {
      dupIds(q.choices).forEach((d) => errs.push(`${w}: 選択肢 ID の重複 ${d}`));
      if (!ids(q.choices).has(q.answer)) errs.push(`${w}: 正解が選択肢にない`);
      // 部分指定: マーカー付き画像があれば、選択肢 ID とマーカー ID が一致すること
      const markers = q.media?.find((m) => m.markers)?.markers;
      if (markers) {
        const mk = ids(markers);
        if (q.choices.some((c) => !mk.has(c.id)) || markers.length !== q.choices.length)
          errs.push(`${w}: マーカーと選択肢の ID が一致しない`);
        // マーカー同士が近すぎると、タップも見分けも難しい
        for (let i = 0; i < markers.length; i++)
          for (let j = i + 1; j < markers.length; j++) {
            const a = markers[i]!, b = markers[j]!;
            if (Math.hypot(a.x - b.x, a.y - b.y) < MIN_MARKER_DISTANCE)
              errs.push(`${w}: マーカー ${a.id} と ${b.id} が近すぎる`);
          }
      }
      break;
    }
    case "order": {
      const e = ids(q.entries);
      if (q.answer.length !== q.entries.length || new Set(q.answer).size !== q.answer.length || q.answer.some((a) => !e.has(a)))
        errs.push(`${w}: 正解の並びが項目と一致しない`);
      break;
    }
    case "match": {
      const l = ids(q.left), r = ids(q.right);
      if (q.pairs.some(([a, b]) => !l.has(a) || !r.has(b))) errs.push(`${w}: 組み合わせの ID が存在しない`);
      if (new Set(q.pairs.map((p) => p[0])).size !== q.pairs.length) errs.push(`${w}: 左側の項目が重複して組まれている`);
      if (q.pairs.length !== q.left.length) errs.push(`${w}: 左側のすべての項目に組み合わせが必要`);
      break;
    }
    case "classify": {
      const b = ids(q.buckets);
      if (q.entries.some((e) => !b.has(e.bucket))) errs.push(`${w}: 存在しない分類先`);
      break;
    }
    case "year":
      break;
    case "map": {
      const m = maps.get(q.map);
      if (!m) errs.push(`${w}: 地図が存在しない ${q.map}`);
      else if (!m.regions.some((r) => r.id === q.answer)) errs.push(`${w}: 地図に地域がない ${q.answer}`);
      break;
    }
  }
  return errs;
}
