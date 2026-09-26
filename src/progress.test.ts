import { beforeEach, describe, expect, it } from "vitest";
import { activeQuestions } from "./content";
import { allEntries, distribution, initProgress, isDue, mergeEntries, nextDue, record, resetProgressForTest, stars, streakDays } from "./progress";
import { pickQuestions } from "./session";

const DAY = 24 * 60 * 60 * 1000;
const q = () => activeQuestions().find((x) => x.id === "q-pt-overview-image-medieval")!;
const correct = { outcome: "correct" as const };

beforeEach(() => resetProgressForTest());

describe("学習記録と FSRS", () => {
  it("まだ解いていない問題は★0で、期限もない", () => {
    expect(stars(q())).toBe(0);
    expect(isDue(q())).toBe(false);
  });

  it("解くと★がつき、次の復習日が決まる。期限が来ると復習の対象になる", async () => {
    const t0 = Date.now() - 400 * DAY;
    await record(q().id, correct, "Good", t0);
    expect(stars(q())).toBeGreaterThanOrEqual(1);
    const due = nextDue(q())!.getTime();
    expect(due).toBeGreaterThan(t0);
    expect(isDue(q(), { now: due + 1 })).toBe(true);
  });

  it("正解を重ねて安定度が上がると★★★（定着）になる", async () => {
    let t = Date.now() - 1000 * DAY;
    await record(q().id, correct, "Good", t);
    for (let i = 0; i < 8; i++) {
      t = Math.max(t + DAY, nextDue(q())!.getTime());
      await record(q().id, correct, "Good", t);
    }
    expect(stars(q())).toBe(3);
  });

  it("間違えると★は下がる", async () => {
    let t = Date.now() - 1000 * DAY;
    for (let i = 0; i < 8; i++) {
      await record(q().id, correct, "Good", t);
      t = Math.max(t + DAY, nextDue(q())!.getTime());
    }
    expect(stars(q())).toBe(3);
    await record(q().id, { outcome: "wrong" }, "Again", t);
    expect(stars(q())).toBeLessThan(3);
  });

  it("記録は IndexedDB に保存され、読み直しても同じ状態になる", async () => {
    await record(q().id, correct, "Good", Date.now() - 10 * DAY);
    const before = stars(q());
    await initProgress();
    expect(allEntries().length).toBeGreaterThanOrEqual(1);
    expect(stars(q())).toBe(before);
  });

  it("読み込んだ記録は ID で重複を除く", async () => {
    await record(q().id, correct, "Good");
    const same = allEntries();
    expect(mergeEntries(same)).toBe(0);
  });

  it("連続日数は今日（まだなら昨日）から数える", async () => {
    const now = new Date();
    await record(q().id, correct, "Good", now.getTime() - 2 * DAY);
    await record(q().id, correct, "Good", now.getTime() - 1 * DAY);
    expect(streakDays(now)).toBe(2);
    await record(q().id, correct, "Good", now.getTime());
    expect(streakDays(now)).toBe(3);
  });

  it("出題は期限の来た復習を先頭に置く", async () => {
    await record(q().id, correct, "Good", Date.now() - 400 * DAY);
    const picked = pickQuestions("cat:painting/overview");
    expect(picked[0]!.id).toBe(q().id);
    expect(distribution(activeQuestions((r) => r.key === "painting/overview")).due).toBe(1);
  });
});
