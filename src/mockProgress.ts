// モック用の進捗。FSRS と端末内の保存（ADR-0002, ADR-0003）を実装するまでの仮の値
import type { Question } from "./schema";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** 問題の★（0 = まだ解いていない、1〜3） */
export const stars = (q: Question): number => hash(q.id) % 4;
/** 復習の期限が来ているか */
export const isDue = (q: Question): boolean => stars(q) > 0 && stars(q) < 3 && hash(q.id + "due") % 2 === 0;

export type Distribution = { s3: number; s2: number; s1: number; fresh: number; total: number; due: number };

export function distribution(qs: Question[]): Distribution {
  const d: Distribution = { s3: 0, s2: 0, s1: 0, fresh: 0, total: qs.length, due: 0 };
  for (const q of qs) {
    const s = stars(q);
    if (s === 3) d.s3++;
    else if (s === 2) d.s2++;
    else if (s === 1) d.s1++;
    else d.fresh++;
    if (isDue(q)) d.due++;
  }
  return d;
}
