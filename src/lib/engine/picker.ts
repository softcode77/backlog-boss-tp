// "What should I play tonight?" — a transparent scoring engine.
//
// Every candidate game gets points from independent factors (session fit, energy, mood, momentum,
// staleness, learned taste, recent rejections). Each factor also returns a human-readable note, so
// the UI can explain *why* a game was picked — the explanation is the feature.
//
// Pure functions only: no database, no React. That makes it trivial to unit test.

import type { CatalogGame, Mood } from "@/data/catalog";

export type Energy = "low" | "medium" | "high";

export type PickContext = {
  minutes: number;
  energy: Energy;
  mood: Mood | "any";
};

export const DEFAULT_CONTEXT: PickContext = { minutes: 60, energy: "medium", mood: "any" };

export type Candidate = {
  game: CatalogGame;
  status: "backlog" | "playing";
  hoursPlayed: number;
  addedAt: Date;
};

export type FeedbackEvent = {
  game: CatalogGame;
  accepted: boolean;
  createdAt: Date;
};

export type Factor = { label: string; points: number; note: string };

export type ScoredPick = {
  game: CatalogGame;
  status: Candidate["status"];
  score: number;
  /** True when the game simply can't be played in the time available. */
  blocked: boolean;
  factors: Factor[];
};

export type TasteInsight = { feature: string; affinity: number; text: string };

const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Feature extraction — the "vocabulary" the picker learns preferences over.
// ---------------------------------------------------------------------------

export function lengthBucket(hours: number): "short" | "medium" | "long" {
  if (hours < 15) return "short";
  if (hours <= 40) return "medium";
  return "long";
}

function intensityBucket(intensity: number): "relaxed" | "moderate" | "intense" {
  if (intensity <= 2) return "relaxed";
  if (intensity === 3) return "moderate";
  return "intense";
}

export function featuresOf(game: CatalogGame): string[] {
  return [
    ...game.genres.map((g) => `genre:${g}`),
    `length:${lengthBucket(game.hours)}`,
    `intensity:${intensityBucket(game.intensity)}`,
  ];
}

/** "genre:Roguelike" -> "Roguelike games", "length:long" -> "long games". */
function describeFeature(feature: string): string {
  return `${feature.split(":")[1]} games`;
}

// ---------------------------------------------------------------------------
// Taste learning — turn the feedback history into per-feature affinities.
// ---------------------------------------------------------------------------

/** Feedback older than this many days counts half as much (exponential decay). */
const HALF_LIFE_DAYS = 14;
/** Pseudo-count that pulls affinities toward 0 until there's enough evidence. */
const SMOOTHING = 2;

/**
 * Returns affinity per feature in roughly [-1, 1].
 * +1 = always accepts games with this feature, -1 = always rejects them.
 */
export function learnTaste(feedback: FeedbackEvent[], now: Date): Map<string, number> {
  const sums = new Map<string, { signal: number; weight: number }>();
  for (const event of feedback) {
    const ageDays = Math.max(0, (now.getTime() - event.createdAt.getTime()) / DAY_MS);
    const weight = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
    const signal = (event.accepted ? 1 : -1) * weight;
    for (const feature of featuresOf(event.game)) {
      const s = sums.get(feature) ?? { signal: 0, weight: 0 };
      s.signal += signal;
      s.weight += weight;
      sums.set(feature, s);
    }
  }
  const affinities = new Map<string, number>();
  for (const [feature, { signal, weight }] of sums) {
    affinities.set(feature, signal / (weight + SMOOTHING));
  }
  return affinities;
}

/** The strongest learned preferences, phrased for humans. */
export function tasteInsights(taste: Map<string, number>, limit = 4): TasteInsight[] {
  return [...taste.entries()]
    .filter(([, a]) => Math.abs(a) >= 0.15)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, limit)
    .map(([feature, affinity]) => ({
      feature,
      affinity,
      text:
        affinity > 0
          ? `You tend to say yes to ${describeFeature(feature)}`
          : `You keep skipping ${describeFeature(feature)}`,
    }));
}

// ---------------------------------------------------------------------------
// Individual scoring factors.
// ---------------------------------------------------------------------------

const ENERGY_RANGE: Record<Energy, [number, number]> = {
  low: [1, 2],
  medium: [2, 3],
  high: [4, 5],
};

function sessionFit(game: CatalogGame, ctx: PickContext): Factor & { blocked: boolean } {
  if (game.minSession > ctx.minutes) {
    return {
      label: "Session length",
      points: -100,
      blocked: true,
      note: `Needs ~${game.minSession} min to make progress, you have ${ctx.minutes}`,
    };
  }
  if (ctx.minutes >= game.minSession * 1.5) {
    return { label: "Session length", points: 15, blocked: false, note: `Plenty of time for a proper session` };
  }
  return { label: "Session length", points: 7, blocked: false, note: `Just enough time to get somewhere` };
}

function energyMatch(game: CatalogGame, ctx: PickContext): Factor {
  const [lo, hi] = ENERGY_RANGE[ctx.energy];
  const distance = game.intensity < lo ? lo - game.intensity : game.intensity > hi ? game.intensity - hi : 0;
  const points = 15 - distance * 9;
  let note: string;
  if (distance === 0) note = `Intensity ${game.intensity}/5 suits your ${ctx.energy} energy`;
  else if (game.intensity > hi) note = `Intensity ${game.intensity}/5 is a lot for ${ctx.energy} energy`;
  else note = `Might feel too sleepy for ${ctx.energy} energy`;
  return { label: "Energy", points, note };
}

function moodMatch(game: CatalogGame, ctx: PickContext): Factor | null {
  if (ctx.mood === "any") return null;
  const idx = game.moods.indexOf(ctx.mood);
  if (idx === 0) return { label: "Mood", points: 20, note: `Exactly the ${ctx.mood} vibe you asked for` };
  if (idx > 0) return { label: "Mood", points: 12, note: `Has a ${ctx.mood} side to it` };
  return { label: "Mood", points: -10, note: `Not really a ${ctx.mood} game` };
}

function momentum(c: Candidate): Factor | null {
  if (c.status !== "playing") return null;
  const progress = Math.min(1, c.hoursPlayed / c.game.hours);
  const pct = Math.round(progress * 100);
  if (progress >= 0.7) return { label: "Momentum", points: 18, note: `You're ~${pct}% through — finish it!` };
  return { label: "Momentum", points: 10, note: `Already in progress (~${pct}%) — keep the thread going` };
}

function staleness(c: Candidate, now: Date): Factor | null {
  if (c.status !== "backlog") return null;
  const days = Math.floor((now.getTime() - c.addedAt.getTime()) / DAY_MS);
  if (days < 7) return null;
  const points = Math.min(10, Math.round(Math.log2(days / 7 + 1) * 2.5));
  return { label: "Backlog age", points, note: `Gathering dust for ${days} days` };
}

function learnedTaste(game: CatalogGame, taste: Map<string, number>): Factor | null {
  const scored = featuresOf(game)
    .map((f) => ({ f, a: taste.get(f) ?? 0 }))
    .filter((x) => x.a !== 0);
  if (scored.length === 0) return null;
  const avg = scored.reduce((sum, x) => sum + x.a, 0) / featuresOf(game).length;
  const points = Math.round(avg * 25);
  if (points === 0) return null;
  // Explain with the strongest feature pulling in the same direction as the overall score.
  const strongest = scored
    .filter((x) => Math.sign(x.a) === Math.sign(points))
    .sort((a, b) => Math.abs(b.a) - Math.abs(a.a))[0];
  const note =
    strongest.a > 0
      ? `You usually say yes to ${describeFeature(strongest.f)}`
      : `You've been skipping ${describeFeature(strongest.f)} lately`;
  return { label: "Your taste", points, note };
}

/** Rejected in the last 12 hours? Respect it. */
const SNOOZE_MS = 12 * 60 * 60 * 1000;

function recentlyRejected(game: CatalogGame, feedback: FeedbackEvent[], now: Date): Factor | null {
  const hit = feedback.some(
    (f) => !f.accepted && f.game.id === game.id && now.getTime() - f.createdAt.getTime() < SNOOZE_MS,
  );
  return hit ? { label: "Snoozed", points: -40, note: `You said "not tonight" recently` } : null;
}

// ---------------------------------------------------------------------------
// Putting it together.
// ---------------------------------------------------------------------------

export function scoreCandidates(
  candidates: Candidate[],
  ctx: PickContext,
  feedback: FeedbackEvent[],
  now: Date = new Date(),
): ScoredPick[] {
  const taste = learnTaste(feedback, now);

  const scored = candidates.map((c): ScoredPick => {
    const fit = sessionFit(c.game, ctx);
    const factors = [
      fit,
      energyMatch(c.game, ctx),
      moodMatch(c.game, ctx),
      momentum(c),
      staleness(c, now),
      learnedTaste(c.game, taste),
      recentlyRejected(c.game, feedback, now),
    ].filter((f): f is Factor => f !== null);

    return {
      game: c.game,
      status: c.status,
      blocked: fit.blocked,
      score: factors.reduce((sum, f) => sum + f.points, 0),
      factors: factors.map(({ label, points, note }) => ({ label, points, note })),
    };
  });

  // Highest score first; ties broken by title for stable output.
  return scored.sort((a, b) => b.score - a.score || a.game.title.localeCompare(b.game.title));
}

/** The best reasons a game was chosen (positive factors, strongest first). */
export function topReasons(pick: ScoredPick, n = 3): Factor[] {
  return pick.factors.filter((f) => f.points > 0).sort((a, b) => b.points - a.points).slice(0, n);
}

/** The main reason a runner-up lost (its most negative factor). */
export function mainDrawback(pick: ScoredPick): Factor | undefined {
  return [...pick.factors].sort((a, b) => a.points - b.points).find((f) => f.points < 0);
}
