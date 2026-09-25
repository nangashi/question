// 学習セッションに出す問題を選ぶ
import { activeQuestions, questionRef, type CategoryRef } from "./content";
import { isDue, stars } from "./mockProgress";
import type { Question } from "./schema";

export const SESSION_SIZE = 5;

/**
 * scope:
 *   all                      全テーマ（おまかせ）
 *   theme:<themeId>          テーマ全体
 *   cat:<themeId>/<catId>    サブカテゴリ
 *   item:<itemId>            知識カード
 *   formats                  全出題形式のお試し（モック用）
 */
export function pickQuestions(scope: string): Question[] {
  if (scope === "formats") return oneOfEachFormat();
  const [kind, arg = ""] = scope.split(/:(.*)/s);
  const filter = (ref: CategoryRef) =>
    kind === "theme" ? ref.themeId === arg : kind === "cat" ? ref.key === arg : true;
  let pool = activeQuestions(filter);
  if (kind === "item") pool = activeQuestions().filter((q) => q.itemIds.includes(arg));
  // 期限の来た復習を優先し、残りを新しい問題などで埋める（ADR-0002）
  const due = shuffle(pool.filter(isDue));
  const rest = shuffle(pool.filter((q) => !isDue(q))).sort((a, b) => stars(a) - stars(b));
  return [...due, ...rest].slice(0, SESSION_SIZE);
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
