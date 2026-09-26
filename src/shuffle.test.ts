import { describe, expect, it } from "vitest";
import { shuffle, shuffleUntil } from "./shuffle";

describe("shuffle", () => {
  it("要素を失わず、元の配列を変えない", () => {
    const xs = [1, 2, 3, 4];
    expect(shuffle(xs).sort()).toEqual([1, 2, 3, 4]);
    expect(xs).toEqual([1, 2, 3, 4]);
  });

  it("先頭の要素が毎回同じ位置に来るわけではない", () => {
    const firsts = new Set(Array.from({ length: 200 }, () => shuffle(["a", "b", "c", "d"]).indexOf("a")));
    expect(firsts.size).toBe(4);
  });

  it("shuffleUntil は条件を満たす並びを返す（元の並びを避ける）", () => {
    for (let i = 0; i < 100; i++) expect(shuffleUntil([1, 2], (a) => a[0] !== 1)).toEqual([2, 1]);
  });
});
