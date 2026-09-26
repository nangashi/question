import { describe, expect, it } from "vitest";
import { compareLearnOrder, activeQuestions, learnKey } from "./content";
import { isDue, stars } from "./progress";
import { pickQuestions } from "./session";

describe("出題の順（ADR-0011）", () => {
  it("復習の期限が来た問題を先に、次に未学習の問題を学ぶ順に出す", () => {
    const scope = "cat:painting/overview";
    const picked = pickQuestions(scope);
    const dueCount = picked.filter((q) => isDue(q)).length;
    // 期限の来た問題はすべて先頭に並ぶ
    expect(picked.slice(0, dueCount).every((q) => isDue(q))).toBe(true);
    // 続く未学習の問題は学ぶ順
    const fresh = picked.slice(dueCount).filter((q) => stars(q) === 0);
    expect(fresh).toEqual([...fresh].sort(compareLearnOrder));
  });

  it("まとめ問題は、関わる知識カードのうち最も後ろの位置に並ぶ", () => {
    const q = activeQuestions().find((x) => x.id === "q-pt-overview-order-late")!;
    const single = activeQuestions().find((x) => x.id === "q-pt-overview-image-romanticism")!;
    expect(compareLearnOrder(single, q)).toBeLessThan(0);
    expect(learnKey(q).length).toBe(4);
  });
});
