// 解答ログの保存（ADR-0003）。端末の IndexedDB に追記のみで保存する
import { openDB, type IDBPDatabase } from "idb";
import type { Outcome, Rating } from "./grading";

export type ReviewEntry = {
  id: string; // ログ自体の ID（書き出し・読み込みで重複を避けるため）
  questionId: string;
  at: number; // 解答した時刻（ミリ秒）
  outcome: Outcome;
  rating: Rating;
};

const DB_NAME = "question";
const STORE = "reviews";
let dbPromise: Promise<IDBPDatabase> | undefined;

function db(): Promise<IDBPDatabase> {
  dbPromise ??= openDB(DB_NAME, 1, {
    upgrade(d) {
      const s = d.createObjectStore(STORE, { keyPath: "id" });
      s.createIndex("questionId", "questionId");
    },
  });
  return dbPromise;
}

export async function loadAll(): Promise<ReviewEntry[]> {
  return (await db()).getAll(STORE);
}

export async function append(entry: ReviewEntry): Promise<void> {
  await (await db()).put(STORE, entry);
}

/** 読み込んだログを追加する。同じ ID のログは上書きになるので、何度読み込んでも重複しない */
export async function importEntries(entries: ReviewEntry[]): Promise<void> {
  const tx = (await db()).transaction(STORE, "readwrite");
  await Promise.all([...entries.map((e) => tx.store.put(e)), tx.done]);
}

export function newEntryId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
