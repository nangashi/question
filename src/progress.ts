// 学習の進み具合（ADR-0002, ADR-0003, ADR-0011）。
// 解答ログを古い順に FSRS に通して、問題ごとの状態（次の復習日・安定度）を計算する
import { useEffect, useState } from "preact/hooks";
import { createEmptyCard, fsrs, Rating as FsrsRating, State, type Card, type Grade } from "ts-fsrs";
import type { Grade as Result, Rating } from "./grading";
import { append, loadAll, newEntryId, type ReviewEntry } from "./reviewLog";
import type { Question } from "./schema";

// 読み直しで毎回同じ結果になるよう、復習間隔のゆらぎ（fuzz）は使わない
const scheduler = fsrs({ enable_fuzz: false });
const toGrade: Record<Rating, Grade> = { Again: FsrsRating.Again, Hard: FsrsRating.Hard, Good: FsrsRating.Good };

const cards = new Map<string, Card>();
let entries: ReviewEntry[] = [];
let storageAvailable = true;
let version = 0;
const listeners = new Set<() => void>();

function apply(e: ReviewEntry): void {
  const card: Card = cards.get(e.questionId) ?? createEmptyCard<Card>(new Date(e.at));
  cards.set(e.questionId, scheduler.next(card, new Date(e.at), toGrade[e.rating]).card);
}

function rebuild(): void {
  cards.clear();
  entries.sort((a, b) => a.at - b.at).forEach(apply);
  version++;
  listeners.forEach((l) => l());
}

/** 起動時に一度呼ぶ。IndexedDB が使えない環境では、記録をこの画面を開いている間だけ保持する */
export async function initProgress(): Promise<void> {
  try {
    entries = await loadAll();
    storageAvailable = true;
  } catch {
    entries = [];
    storageAvailable = false;
  }
  rebuild();
}

export const isStorageAvailable = () => storageAvailable;
export const allEntries = () => [...entries];

/** 解答を記録する */
export async function record(questionId: string, result: Result, rating: Rating, at = Date.now()): Promise<void> {
  const e: ReviewEntry = { id: newEntryId(), questionId, at, outcome: result.outcome, rating };
  entries.push(e);
  apply(e);
  version++;
  listeners.forEach((l) => l());
  if (storageAvailable) {
    try {
      await append(e);
    } catch {
      storageAvailable = false;
    }
  }
}

/** 読み込んだログを反映する（書き出し・読み込み） */
export function mergeEntries(incoming: ReviewEntry[]): number {
  const known = new Set(entries.map((e) => e.id));
  const added = incoming.filter((e) => !known.has(e.id));
  entries.push(...added);
  rebuild();
  return added.length;
}

/**
 * 問題の★（0 = まだ解いていない、1〜3）。FSRS の安定度（記憶がもつ日数の目安）で分ける
 * - ★: 学習中、または安定度 7 日未満
 * - ★★: 安定度 7〜30 日
 * - ★★★（定着）: 安定度 30 日以上
 */
export function stars(q: Question): number {
  const c = cards.get(q.id);
  if (!c) return 0;
  if (c.state === State.Learning || c.state === State.Relearning || c.stability < 7) return 1;
  return c.stability < 30 ? 2 : 3;
}

/**
 * 復習の期限が来ているか。
 * 時刻はオブジェクトで渡す（filter(isDue) のように渡すと配列の添字が時刻として扱われる誤りを、型で防ぐため）
 */
export function isDue(q: Question, { now = Date.now() }: { now?: number } = {}): boolean {
  const c = cards.get(q.id);
  return c !== undefined && c.due.getTime() <= now;
}

/** 次の復習の予定日（まだ解いていなければ undefined） */
export const nextDue = (q: Question): Date | undefined => cards.get(q.id)?.due;

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

/** 今日（または昨日）まで何日続けて学習したか */
export function streakDays(now = new Date()): number {
  const days = new Set(entries.map((e) => new Date(e.at).toDateString()));
  const d = new Date(now);
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1); // 今日まだ解いていなければ昨日から数える
  let n = 0;
  while (days.has(d.toDateString())) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** 記録が変わったら画面を描き直すためのフック */
export function useProgressVersion(): number {
  const [, set] = useState(version);
  useEffect(() => {
    const l = () => set(version);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return version;
}

/** テスト用: 記録を空にする */
export function resetProgressForTest(): void {
  entries = [];
  rebuild();
}
