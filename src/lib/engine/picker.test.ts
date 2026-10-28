import { describe, expect, it } from "vitest";
import { getCatalogGame, type CatalogGame } from "@/data/catalog";
import { learnTaste, scoreCandidates, type Candidate, type FeedbackEvent } from "./picker";

const now = new Date("2026-10-25T20:00:00Z");
const game = (id: string): CatalogGame => getCatalogGame(id)!;
const backlog = (id: string, daysAgo = 30): Candidate => ({
  game: game(id),
  status: "backlog",
  hoursPlayed: 0,
  addedAt: new Date(now.getTime() - daysAgo * 86_400_000),
});

describe("scoreCandidates", () => {
  it("picks a chill short-session game for a tired 45-minute evening", () => {
    const picks = scoreCandidates(
      [backlog("elden-ring"), backlog("stardew-valley"), backlog("hades")],
      { minutes: 45, energy: "low", mood: "chill" },
      [],
      now,
    );
    expect(picks[0].game.id).toBe("stardew-valley");
  });

  it("blocks games that need more time than you have", () => {
    const picks = scoreCandidates([backlog("baldurs-gate-3")], { minutes: 30, energy: "medium", mood: "any" }, [], now);
    expect(picks[0].blocked).toBe(true);
    expect(picks[0].factors.find((f) => f.label === "Session length")?.points).toBeLessThan(0);
  });

  it("favours a game you're nearly done with", () => {
    const nearlyDone: Candidate = { ...backlog("hades"), status: "playing", hoursPlayed: 20 };
    const picks = scoreCandidates(
      [nearlyDone, backlog("dead-cells")],
      { minutes: 60, energy: "high", mood: "action" },
      [],
      now,
    );
    expect(picks[0].game.id).toBe("hades");
  });

  it("snoozes a game you just rejected", () => {
    const ctx = { minutes: 60, energy: "low" as const, mood: "chill" as const };
    const before = scoreCandidates([backlog("stardew-valley"), backlog("animal-crossing")], ctx, [], now);
    const rejectedId = before[0].game.id;
    const feedback: FeedbackEvent[] = [{ game: game(rejectedId), accepted: false, createdAt: now }];
    const after = scoreCandidates([backlog("stardew-valley"), backlog("animal-crossing")], ctx, feedback, now);
    expect(after[0].game.id).not.toBe(rejectedId);
  });
});

describe("taste explanation", () => {
  it("explains a positive taste score with a liked feature, not a disliked one", () => {
    const old = new Date(now.getTime() - 3 * 86_400_000);
    const feedback: FeedbackEvent[] = [
      { game: game("portal-2"), accepted: true, createdAt: old }, // short, relaxed, Puzzle
      { game: game("portal-2"), accepted: true, createdAt: old },
      { game: game("cyberpunk"), accepted: false, createdAt: old }, // moderate intensity
    ];
    const [pick] = scoreCandidates([backlog("inside")], { minutes: 60, energy: "medium", mood: "any" }, feedback, now);
    const taste = pick.factors.find((f) => f.label === "Your taste")!;
    expect(taste.points).toBeGreaterThan(0);
    expect(taste.note).toMatch(/say yes/);
  });
});

describe("learnTaste", () => {
  it("learns a dislike of long games from repeated rejections", () => {
    const old = new Date(now.getTime() - 3 * 86_400_000); // outside the snooze window
    const feedback: FeedbackEvent[] = ["witcher-3", "red-dead-2", "persona-5"].map((id) => ({
      game: game(id),
      accepted: false,
      createdAt: old,
    }));
    const taste = learnTaste(feedback, now);
    expect(taste.get("length:long")).toBeLessThan(-0.4);
  });

  it("weights recent feedback more than old feedback", () => {
    const recent = learnTaste([{ game: game("hades"), accepted: true, createdAt: now }], now);
    const stale = learnTaste(
      [{ game: game("hades"), accepted: true, createdAt: new Date(now.getTime() - 60 * 86_400_000) }],
      now,
    );
    expect(recent.get("genre:Roguelike")!).toBeGreaterThan(stale.get("genre:Roguelike")!);
  });
});
