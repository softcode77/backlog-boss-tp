import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { libraryEntries, pickFeedback, plans } from "@/db/schema";
import { SAMPLE_LIBRARY } from "@/data/catalog";
import { DEFAULT_WEEK } from "./queries";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Fills a user's library with a realistic starter backlog (skips games they already have). */
export async function seedSampleLibrary(userId: string) {
  const now = Date.now();
  const existing = new Set(
    (await db.query.libraryEntries.findMany({ where: eq(libraryEntries.userId, userId), columns: { gameId: true } })).map(
      (r) => r.gameId,
    ),
  );
  const rows = SAMPLE_LIBRARY.filter((s) => !existing.has(s.gameId)).map((s) => ({
    id: crypto.randomUUID(),
    userId,
    gameId: s.gameId,
    status: s.status,
    hoursPlayed: s.hoursPlayed,
    rating: s.rating ?? null,
    addedAt: new Date(now - s.daysAgo * DAY_MS),
    updatedAt: new Date(now - Math.min(s.daysAgo, 30) * DAY_MS),
  }));
  if (rows.length) await db.insert(libraryEntries).values(rows);
}

/** Demo accounts also get some picker history (so "what I've learned" isn't empty) and a plan. */
export async function seedDemoExtras(userId: string) {
  const now = Date.now();
  const history: [string, boolean, number][] = [
    ["red-dead-2", false, 3],
    ["baldurs-gate-3", false, 5],
    ["persona-5", false, 9],
    ["balatro", true, 2],
    ["hades", true, 6],
    ["celeste", true, 12],
  ];
  await db.insert(pickFeedback).values(
    history.map(([gameId, accepted, daysAgo]) => ({
      id: crypto.randomUUID(),
      userId,
      gameId,
      accepted,
      createdAt: new Date(now - daysAgo * DAY_MS),
    })),
  );
  const deadline = new Date(now + 42 * DAY_MS).toISOString().slice(0, 10);
  await db
    .insert(plans)
    .values({
      userId,
      weeklyMinutes: JSON.stringify(DEFAULT_WEEK),
      deadline,
      queue: JSON.stringify(["elden-ring", "outer-wilds", "baldurs-gate-3"]),
    })
    .onConflictDoNothing();
}
