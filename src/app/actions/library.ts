"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { db } from "@/db";
import { libraryEntries, STATUSES } from "@/db/schema";
import { getCatalogGame } from "@/data/catalog";
import { requireUser } from "@/lib/dal";
import { seedSampleLibrary } from "@/lib/sample";

// Server Actions are public HTTP endpoints under the hood, so every one of them:
//   1. checks who's calling (requireUser)
//   2. validates its input (zod)
//   3. scopes the DB write to that user's rows (userId in the WHERE clause)

const Status = z.enum(STATUSES);

/** Every page reads library data, so refresh them all after a change. */
function refresh() {
  revalidatePath("/", "layout");
}

export async function addGame(gameId: string, status: z.infer<typeof Status> = "backlog") {
  const user = await requireUser();
  if (!getCatalogGame(gameId)) throw new Error("Unknown game");
  const now = new Date();
  await db
    .insert(libraryEntries)
    .values({
      id: crypto.randomUUID(),
      userId: user.id,
      gameId,
      status: Status.parse(status),
      hoursPlayed: 0,
      addedAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing(); // already in library? no-op
  refresh();
}

const Patch = z.object({
  status: Status.optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

export async function updateEntry(entryId: string, patch: z.infer<typeof Patch>) {
  const user = await requireUser();
  const data = Patch.parse(patch);
  await db
    .update(libraryEntries)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(libraryEntries.id, entryId), eq(libraryEntries.userId, user.id)));
  refresh();
}

/** Log a play session. Starting a backlog game moves it to "playing" automatically. */
export async function logSession(entryId: string, minutes: number) {
  const user = await requireUser();
  const mins = z.number().int().min(5).max(24 * 60).parse(minutes);
  await db
    .update(libraryEntries)
    .set({
      hoursPlayed: sql`${libraryEntries.hoursPlayed} + ${mins / 60}`,
      status: sql`CASE WHEN ${libraryEntries.status} = 'backlog' THEN 'playing' ELSE ${libraryEntries.status} END`,
      updatedAt: new Date(),
    })
    .where(and(eq(libraryEntries.id, entryId), eq(libraryEntries.userId, user.id)));
  refresh();
}

export async function removeEntry(entryId: string) {
  const user = await requireUser();
  await db.delete(libraryEntries).where(and(eq(libraryEntries.id, entryId), eq(libraryEntries.userId, user.id)));
  refresh();
}

export async function loadSampleLibrary() {
  const user = await requireUser();
  await seedSampleLibrary(user.id);
  refresh();
}
