import "server-only";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { libraryEntries, pickFeedback, plans, type Status } from "@/db/schema";
import { getCatalogGame, type CatalogGame } from "@/data/catalog";

// Read helpers. They always take a userId (from requireUser) so one user can never read another's data.

export type LibraryItem = {
  id: string;
  game: CatalogGame;
  status: Status;
  hoursPlayed: number;
  rating: number | null;
  addedAt: Date;
};

export async function getLibrary(userId: string): Promise<LibraryItem[]> {
  const rows = await db.query.libraryEntries.findMany({
    where: eq(libraryEntries.userId, userId),
    orderBy: desc(libraryEntries.updatedAt),
  });
  return rows.flatMap((r) => {
    const game = getCatalogGame(r.gameId);
    return game
      ? [{ id: r.id, game, status: r.status, hoursPlayed: r.hoursPlayed, rating: r.rating, addedAt: r.addedAt }]
      : [];
  });
}

/** Feedback from the last 90 days — older signals have decayed to almost nothing anyway. */
export async function getFeedback(userId: string) {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const rows = await db.query.pickFeedback.findMany({
    where: and(eq(pickFeedback.userId, userId), gt(pickFeedback.createdAt, since)),
    orderBy: desc(pickFeedback.createdAt),
  });
  return rows.flatMap((r) => {
    const game = getCatalogGame(r.gameId);
    return game ? [{ game, accepted: r.accepted, createdAt: r.createdAt }] : [];
  });
}

export type SavedPlan = { weeklyMinutes: number[]; deadline: string; queue: string[] };

export const DEFAULT_WEEK = [60, 60, 60, 60, 90, 180, 180];

export async function getPlan(userId: string): Promise<SavedPlan | null> {
  const row = await db.query.plans.findFirst({ where: eq(plans.userId, userId) });
  if (!row) return null;
  return {
    weeklyMinutes: JSON.parse(row.weeklyMinutes),
    deadline: row.deadline,
    queue: JSON.parse(row.queue),
  };
}
