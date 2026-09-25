import { describe, expect, it } from "vitest";
import { grade, toRating } from "./grading";
import type { Question } from "./schema";

const base = { id: "q", itemIds: ["i"], prompt: "p", explanation: "e", status: "active" as const };

describe("grade", () => {
  it("並べ替えは完全一致で正解、一部一致は部分正解", () => {
    const q: Question = { ...base, type: "order", entries: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }], answer: ["a", "b", "c"] };
    expect(grade(q, { type: "order", order: ["a", "b", "c"] }).outcome).toBe("correct");
    expect(grade(q, { type: "order", order: ["a", "c", "b"] })).toEqual({ outcome: "partial", correctCount: 1, total: 3 });
    expect(grade(q, { type: "order", order: ["c", "a", "b"] }).outcome).toBe("wrong");
  });

  it("年代推定は許容幅内で正解、2 倍以内で惜しい", () => {
    const q: Question = { ...base, type: "year", answer: 1637, tolerance: 3 };
    expect(grade(q, { type: "year", year: 1640 }).outcome).toBe("correct");
    expect(grade(q, { type: "year", year: 1643 }).outcome).toBe("near");
    expect(grade(q, { type: "year", year: 1644 }).outcome).toBe("wrong");
  });

  it("組み合わせと分類は正しい数を数える", () => {
    const m: Question = { ...base, type: "match", left: [{ id: "l1", text: "1" }, { id: "l2", text: "2" }], right: [{ id: "r1", text: "1" }, { id: "r2", text: "2" }], pairs: [["l1", "r1"], ["l2", "r2"]] };
    expect(grade(m, { type: "match", pairs: { l1: "r1", l2: "r1" } })).toEqual({ outcome: "partial", correctCount: 1, total: 2 });
    const c: Question = { ...base, type: "classify", buckets: [{ id: "x", text: "X" }, { id: "y", text: "Y" }], entries: [{ id: "e1", text: "1", bucket: "x" }, { id: "e2", text: "2", bucket: "y" }, { id: "e3", text: "3", bucket: "x" }] };
    expect(grade(c, { type: "classify", buckets: { e1: "x", e2: "y", e3: "x" } }).outcome).toBe("correct");
  });

  it("スキップは不正解", () => {
    const q: Question = { ...base, type: "map", map: "m", answer: "jp-42" };
    expect(grade(q, { type: "skip" }).outcome).toBe("wrong");
  });
});

describe("toRating", () => {
  it("正解は自信で Good / Hard、惜しいは Hard、部分正解と不正解は Again", () => {
    expect(toRating({ outcome: "correct" }, true)).toBe("Good");
    expect(toRating({ outcome: "correct" }, false)).toBe("Hard");
    expect(toRating({ outcome: "near" }, true)).toBe("Hard");
    expect(toRating({ outcome: "partial", correctCount: 3, total: 4 }, true)).toBe("Again");
    expect(toRating({ outcome: "wrong" }, true)).toBe("Again");
  });
});
