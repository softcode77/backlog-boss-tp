"use server";

import * as z from "zod";
import { db } from "@/db";
import { pickFeedback } from "@/db/schema";
import { getCatalogGame, MOODS, type Mood } from "@/data/catalog";
import { requireUser } from "@/lib/dal";
import { getFeedback, getLibrary } from "@/lib/queries";
import { scoreCandidates, tasteInsights, learnTaste, type ScoredPick, type TasteInsight } from "@/lib/engine/picker";

const Context = z.object({
  minutes: z.number().int().min(10).max(600),
  energy: z.enum(["low", "medium", "high"]),
  mood: z.custom<Mood | "any">((v) => v === "any" || MOODS.some((m) => m.id === v), { error: "Unknown mood" }),
});

export type PickResult = { picks: ScoredPick[]; insights: TasteInsight[]; candidateCount: number };

/** Score every unfinished game in the user's library for the given evening. */
export async function getPicks(input: z.infer<typeof Context>): Promise<PickResult> {
  const user = await requireUser();
  const ctx = Context.parse(input);
  const [library, feedback] = await Promise.all([getLibrary(user.id), getFeedback(user.id)]);

  const candidates = library
    .filter((e) => e.status === "backlog" || e.status === "playing")
    .map((e) => ({
      game: e.game,
      status: e.status as "backlog" | "playing",
      hoursPlayed: e.hoursPlayed,
      addedAt: e.addedAt,
    }));

  const now = new Date();
  return {
    picks: scoreCandidates(candidates, ctx, feedback, now),
    insights: tasteInsights(learnTaste(feedback, now)),
    candidateCount: candidates.length,
  };
}

/** "Play this" / "Not tonight" — the signal the picker learns from. */
export async function recordFeedback(gameId: string, accepted: boolean) {
  const user = await requireUser();
  if (!getCatalogGame(gameId)) throw new Error("Unknown game");
  await db.insert(pickFeedback).values({
    id: crypto.randomUUID(),
    userId: user.id,
    gameId,
    accepted: z.boolean().parse(accepted),
    createdAt: new Date(),
  });
}
