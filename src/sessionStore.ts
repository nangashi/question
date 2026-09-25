// 出題中の状態を端末に保存し、戻る操作や再読み込みのあとも続きから再開できるようにする。
// 解答ログ（ADR-0003、IndexedDB）とは別の、小さな一時データなので localStorage に置く。
// localStorage が使えない環境（プライベートブラウズなど）では保存せずに動く。
import type { Grade, Rating, Response } from "./grading";

export type SessionResult = { questionId: string; grade: Grade; rating: Rating };

export type SavedSession = {
  id: string;
  scope: string;
  questionIds: string[];
  index: number;
  response?: Response;
  results: SessionResult[];
  updatedAt: number;
};

const PREFIX = "session:";
const KEEP = 5; // 保存しておく出題の数（古いものから消す）

export function newSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function loadSession(id: string): SavedSession | undefined {
  try {
    const raw = localStorage.getItem(PREFIX + id);
    return raw ? (JSON.parse(raw) as SavedSession) : undefined;
  } catch {
    return undefined;
  }
}

export function saveSession(s: SavedSession): void {
  try {
    localStorage.setItem(PREFIX + s.id, JSON.stringify({ ...s, updatedAt: Date.now() }));
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
    if (keys.length > KEEP) {
      const byAge = keys
        .map((k) => ({ k, t: (JSON.parse(localStorage.getItem(k) ?? "{}") as Partial<SavedSession>).updatedAt ?? 0 }))
        .sort((a, b) => a.t - b.t);
      byAge.slice(0, keys.length - KEEP).forEach(({ k }) => localStorage.removeItem(k));
    }
  } catch {
    // 保存できなくても出題は続けられる
  }
}
