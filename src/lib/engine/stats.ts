// Backlog health: completion stats and a "will you actually finish this?" prediction.
//
// Finish odds use your own history per game length (short / medium / long). Each bucket's finish
// rate is smoothed toward 50% (a Beta(1,1)-style prior) so one dropped game doesn't mean 0%.
// Progress already made nudges the odds up — sunk cost is real.

import type { CatalogGame } from "@/data/catalog";
import type { Status } from "@/db/schema";
import { lengthBucket } from "./picker";

export type StatsEntry = { game: CatalogGame; status: Status; hoursPlayed: number };

export type FinishOdds = { gameId: string; title: string; odds: number; reason: string };

export type BacklogStats = {
  total: number;
  counts: Record<Status, number>;
  /** Finished / (finished + dropped), or null with no history. */
  completionRate: number | null;
  /** Hours left across backlog + playing. */
  hoursRemaining: number;
  /** At your weekly free time, how long to clear everything. Null if no free time set. */
  weeksToClear: number | null;
  odds: FinishOdds[];
  topGenres: { genre: string; count: number }[];
};

const PRIOR_STRENGTH = 2;

export function remainingHours(e: StatsEntry): number {
  return Math.max(0, e.game.hours - e.hoursPlayed);
}

export function computeStats(entries: StatsEntry[], weeklyMinutes: number | null): BacklogStats {
  const counts: Record<Status, number> = { backlog: 0, playing: 0, finished: 0, dropped: 0 };
  for (const e of entries) counts[e.status]++;

  const decided = counts.finished + counts.dropped;
  const completionRate = decided > 0 ? counts.finished / decided : null;

  const open = entries.filter((e) => e.status === "backlog" || e.status === "playing");
  const hoursRemaining = open.reduce((sum, e) => sum + remainingHours(e), 0);
  const weeksToClear = weeklyMinutes && weeklyMinutes > 0 ? (hoursRemaining * 60) / weeklyMinutes : null;

  // Finish rate per length bucket.
  const history = new Map<string, { finished: number; dropped: number }>();
  for (const e of entries) {
    if (e.status !== "finished" && e.status !== "dropped") continue;
    const b = lengthBucket(e.game.hours);
    const h = history.get(b) ?? { finished: 0, dropped: 0 };
    h[e.status]++;
    history.set(b, h);
  }

  const odds: FinishOdds[] = open
    .map((e) => {
      const bucket = lengthBucket(e.game.hours);
      const h = history.get(bucket) ?? { finished: 0, dropped: 0 };
      const base = (h.finished + PRIOR_STRENGTH * 0.5) / (h.finished + h.dropped + PRIOR_STRENGTH);
      const progress = Math.min(1, e.hoursPlayed / e.game.hours);
      const odds = base + (1 - base) * progress * 0.6;
      const reason =
        h.finished + h.dropped === 0
          ? `No history with ${bucket} games yet`
          : `You've finished ${h.finished} of ${h.finished + h.dropped} ${bucket} games` +
            (progress > 0 ? `, and you're ${Math.round(progress * 100)}% in` : "");
      return { gameId: e.game.id, title: e.game.title, odds, reason };
    })
    .sort((a, b) => a.odds - b.odds);

  const genreCounts = new Map<string, number>();
  for (const e of entries) for (const g of e.game.genres) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
  const topGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre, count]) => ({ genre, count }));

  return { total: entries.length, counts, completionRate, hoursRemaining, weeksToClear, odds, topGenres };
}
