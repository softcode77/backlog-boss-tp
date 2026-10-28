import { describe, expect, it } from "vitest";
import { buildPlan, type PlanGame } from "./planner";

const g = (id: string, hours: number, minSession = 30): PlanGame => ({
  id,
  title: id,
  remainingMinutes: hours * 60,
  minSession,
});

// 2026-10-26 is a Monday.
const start = "2026-10-26";

describe("buildPlan", () => {
  it("finishes a game that fits before the deadline", () => {
    const plan = buildPlan({
      weeklyMinutes: [60, 60, 60, 60, 60, 0, 0], // 5h/week, weekdays only
      start,
      deadline: "2026-11-08",
      queue: [g("short", 8)],
    });
    expect(plan.outcomes[0].onTime).toBe(true);
    expect(plan.outcomes[0].finishDate).toBe("2026-11-04"); // 8th weekday session (Wed of week 2)
    expect(plan.days.find((d) => d.date === "2026-10-31")?.sessions).toEqual([]); // Saturday off
  });

  it("flags a late game and suggests extra weekly time", () => {
    const plan = buildPlan({
      weeklyMinutes: [60, 60, 60, 60, 60, 0, 0],
      start,
      deadline: "2026-11-08",
      queue: [g("huge", 50)],
    });
    const o = plan.outcomes[0];
    expect(o.onTime).toBe(false);
    expect(o.finishDate).not.toBeNull();
    expect(plan.suggestions[0]).toMatchObject({ kind: "add-time", gameId: "huge" });
  });

  it("fills a short leftover slot with a game that fits", () => {
    const plan = buildPlan({
      weeklyMinutes: [90, 0, 0, 0, 0, 0, 0],
      start,
      deadline: "2026-10-26",
      queue: [g("long", 1, 60), g("snack", 2, 20)], // 60 min of long, 30 left -> snack
    });
    expect(plan.days[0].sessions).toEqual([
      { gameId: "long", minutes: 60, finishes: true },
      { gameId: "snack", minutes: 30, finishes: false },
    ]);
  });

  it("suggests swapping a late game for a backlog game that fits", () => {
    const plan = buildPlan({
      weeklyMinutes: [120, 120, 120, 120, 120, 120, 120],
      start,
      deadline: "2026-11-01", // 7 days * 2h = 14h available
      queue: [g("epic", 60)],
      alternatives: [g("indie", 10), g("tiny", 2)],
    });
    expect(plan.suggestions).toContainEqual(
      expect.objectContaining({ kind: "swap", gameId: "epic", swapId: "indie" }),
    );
  });

  it("asks for free time when the week is empty", () => {
    const plan = buildPlan({ weeklyMinutes: [0, 0, 0, 0, 0, 0, 0], start, deadline: "2026-11-08", queue: [g("x", 5)] });
    expect(plan.suggestions).toEqual([{ kind: "no-time" }]);
    expect(plan.outcomes[0].finishDate).toBeNull();
  });
});
