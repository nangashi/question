// 採点と FSRS 評価への対応（ADR-0008）
import type { Question } from "./schema";

export type Response =
  | { type: "choice"; choiceId: string }
  | { type: "order"; order: string[] }
  | { type: "match"; pairs: Record<string, string> } // left id -> right id
  | { type: "classify"; buckets: Record<string, string> } // entry id -> bucket id
  | { type: "year"; year: number }
  | { type: "map"; regionId: string }
  | { type: "skip" };

export type Outcome = "correct" | "near" | "partial" | "wrong";
export type Grade = { outcome: Outcome; correctCount?: number; total?: number };
export type Rating = "Again" | "Hard" | "Good";

export function grade(q: Question, r: Response): Grade {
  if (r.type === "skip") return { outcome: "wrong" };
  switch (q.type) {
    case "choice":
      return { outcome: r.type === "choice" && r.choiceId === q.answer ? "correct" : "wrong" };
    case "order": {
      if (r.type !== "order") return { outcome: "wrong" };
      const n = q.answer.filter((id, i) => r.order[i] === id).length;
      return count(n, q.answer.length);
    }
    case "match": {
      if (r.type !== "match") return { outcome: "wrong" };
      const n = q.pairs.filter(([l, rt]) => r.pairs[l] === rt).length;
      return count(n, q.pairs.length);
    }
    case "classify": {
      if (r.type !== "classify") return { outcome: "wrong" };
      const n = q.entries.filter((e) => r.buckets[e.id] === e.bucket).length;
      return count(n, q.entries.length);
    }
    case "year": {
      if (r.type !== "year") return { outcome: "wrong" };
      const diff = Math.abs(r.year - q.answer);
      return { outcome: diff <= q.tolerance ? "correct" : diff <= q.tolerance * 2 ? "near" : "wrong" };
    }
    case "map":
      return { outcome: r.type === "map" && r.regionId === q.answer ? "correct" : "wrong" };
  }
}

function count(n: number, total: number): Grade {
  return { outcome: n === total ? "correct" : n === 0 ? "wrong" : "partial", correctCount: n, total };
}

/** 採点結果と自信の自己申告から FSRS の評価を決める */
export function toRating(g: Grade, confident: boolean): Rating {
  if (g.outcome === "correct") return confident ? "Good" : "Hard";
  if (g.outcome === "near") return "Hard";
  return "Again";
}
