// 学習セッションに出す問題を選ぶ
import { activeQuestions, compareLearnOrder, getLesson, questionRef, type CategoryRef } from "./content";
import { isDue, stars } from "./mockProgress";
import type { Question } from "./schema";

export const SESSION_SIZE = 5;

/**
 * scope:
 *   all                      全テーマ（おまかせ）
 *   theme:<themeId>          テーマ全体
 *   cat:<themeId>/<catId>    サブカテゴリ
 *   item:<itemId>            知識カード
 *   sec:<themeId>/<catId>/<n>  読み物の第 n 節（ADR-0010）
 *   formats                  全出題形式のお試し（モック用）
 */
export function pickQuestions(scope: string): Question[] {
  if (scope === "formats") return oneOfEachFormat();
  if (scope.startsWith("sec:")) {
    const [themeId = "", categoryId = "", n = "1"] = scope.slice(4).split("/");
    return shuffle(sectionQuestions(themeId, categoryId, Number(n)));
  }
  const [kind, arg = ""] = scope.split(/:(.*)/s);
  const filter = (ref: CategoryRef) =>
    kind === "theme" ? ref.themeId === arg : kind === "cat" ? ref.key === arg : true;
  let pool = activeQuestions(filter);
  if (kind === "item") pool = activeQuestions().filter((q) => q.itemIds.includes(arg));
  // 1. 期限の来た復習 2. 未学習の問題を学ぶ順（読み物の順）に 3. 定着度の低い問題（ADR-0011）
  const due = shuffle(pool.filter(isDue));
  const fresh = pool.filter((q) => !isDue(q) && stars(q) === 0).sort(compareLearnOrder);
  const rest = shuffle(pool.filter((q) => !isDue(q) && stars(q) > 0)).sort((a, b) => stars(a) - stars(b));
  return [...due, ...fresh, ...rest].slice(0, SESSION_SIZE);
}

/** 読み物の節が扱う知識カードに関わる問題（まとめ問題は、すべての知識カードがこの節までに出てきたものだけ） */
export function sectionQuestions(themeId: string, categoryId: string, section: number): Question[] {
  const lesson = getLesson(themeId, categoryId);
  const s = lesson?.sections.find((x) => x.index === section);
  if (!lesson || !s) return [];
  const here = new Set(s.itemIds);
  const soFar = new Set(lesson.sections.filter((x) => x.index <= section).flatMap((x) => x.itemIds));
  return activeQuestions((r) => r.key === `${themeId}/${categoryId}`).filter(
    (q) => q.itemIds.some((id) => here.has(id)) && q.itemIds.every((id) => soFar.has(id)),
  );
}

function oneOfEachFormat(): Question[] {
  const all = activeQuestions();
  const kinds: ((q: Question) => boolean)[] = [
    (q) => q.type === "choice" && !q.media?.some((m) => m.markers) && !q.choices.some((c) => c.media),
    (q) => q.type === "choice" && q.choices.some((c) => c.media !== undefined),
    (q) => q.type === "choice" && !!q.media?.some((m) => m.markers),
    (q) => q.type === "order",
    (q) => q.type === "match",
    (q) => q.type === "classify",
    (q) => q.type === "year",
    (q) => q.type === "map",
  ];
  return kinds.map((k) => all.find(k)).filter((q): q is Question => q !== undefined);
}

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export const categoryOf = (q: Question) => questionRef(q);
