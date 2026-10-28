// Campaign planner — fits your queued games into your real weekly free time.
//
// It simulates day by day: each day has a capacity (minutes free that weekday). The top-priority
// unfinished game gets the time ("focus"), but if what's left of the evening is too short for that
// game to be worth booting up, the planner slots in a shorter game that does fit ("filler").
//
// After simulating it reports a finish date per game, flags anything that misses the deadline, and
// suggests fixes: add N hours/week, or swap a late game for a backlog game that would actually fit.
//
// Dates are handled as UTC "YYYY-MM-DD" strings so time zones can't shift days around.

export type PlanGame = {
  id: string;
  title: string;
  remainingMinutes: number;
  minSession: number;
};

export type PlanInput = {
  /** Minutes free per weekday, Monday first. */
  weeklyMinutes: number[];
  /** First day to schedule (YYYY-MM-DD). */
  start: string;
  /** Goal date (YYYY-MM-DD), inclusive. */
  deadline: string;
  /** Games in priority order. */
  queue: PlanGame[];
  /** Backlog games not in the queue — used for swap suggestions. */
  alternatives?: PlanGame[];
};

export type PlanSession = { gameId: string; minutes: number; finishes: boolean };
export type PlanDay = { date: string; weekday: number; capacity: number; sessions: PlanSession[] };

export type GameOutcome = {
  id: string;
  title: string;
  /** Projected finish date, or null if it won't finish within the simulation horizon. */
  finishDate: string | null;
  onTime: boolean;
  /** Minutes still left on the deadline day (0 if on time). */
  minutesShortAtDeadline: number;
};

export type Suggestion =
  | { kind: "add-time"; gameId: string; title: string; extraMinutesPerWeek: number }
  | { kind: "swap"; gameId: string; title: string; swapId: string; swapTitle: string; swapMinutes: number }
  | { kind: "no-time" };

export type PlanResult = {
  /** Every day from start to deadline (inclusive). */
  days: PlanDay[];
  outcomes: GameOutcome[];
  suggestions: Suggestion[];
  totalCapacityToDeadline: number;
  /** Capacity before the deadline not used by any queued game. */
  spareMinutesToDeadline: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
/** Keep simulating past the deadline (up to this long) to project late finish dates. */
const HORIZON_DAYS = 3 * 365;

export function parseDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 0 = Monday ... 6 = Sunday */
export function weekdayIndex(d: Date): number {
  return (d.getUTCDay() + 6) % 7;
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseDate(toIso).getTime() - parseDate(fromIso).getTime()) / DAY_MS);
}

/** Fill one day's capacity. Mutates `remaining`. */
function scheduleDay(capacity: number, queue: PlanGame[], remaining: Map<string, number>): PlanSession[] {
  const sessions: PlanSession[] = [];
  let left = capacity;
  for (const game of queue) {
    const todo = remaining.get(game.id) ?? 0;
    if (todo <= 0) continue;
    // A session only counts if it's long enough to matter — unless it finishes the game.
    const needed = Math.min(game.minSession, todo);
    if (left < needed) continue; // too short tonight; maybe a shorter game fits
    const minutes = Math.min(left, todo);
    remaining.set(game.id, todo - minutes);
    left -= minutes;
    sessions.push({ gameId: game.id, minutes, finishes: todo - minutes <= 0 });
    if (left <= 0) break;
  }
  return sessions;
}

export function buildPlan(input: PlanInput): PlanResult {
  const { weeklyMinutes, start, deadline, queue } = input;
  const remaining = new Map(queue.map((g) => [g.id, Math.max(0, g.remainingMinutes)]));
  const finishDates = new Map<string, string>();
  const shortAtDeadline = new Map<string, number>();
  const days: PlanDay[] = [];

  const deadlineOffset = daysBetween(start, deadline);
  let totalCapacityToDeadline = 0;
  let usedByOnTimeGames = 0;
  const minutesByGameToDeadline = new Map<string, number>();

  // Games with nothing left are finished before we even start.
  for (const g of queue) if ((remaining.get(g.id) ?? 0) <= 0) finishDates.set(g.id, start);

  const startDate = parseDate(start);
  const lastOffset = Math.max(HORIZON_DAYS, deadlineOffset + 1);
  for (let offset = 0; offset < lastOffset; offset++) {
    // Past the deadline we only keep going to project finish dates for late games.
    if (offset > deadlineOffset && finishDates.size === queue.length) break;

    const date = new Date(startDate.getTime() + offset * DAY_MS);
    const iso = formatDate(date);
    const weekday = weekdayIndex(date);
    const capacity = Math.max(0, weeklyMinutes[weekday] ?? 0);
    const sessions = scheduleDay(capacity, queue, remaining);

    for (const s of sessions) if (s.finishes) finishDates.set(s.gameId, iso);

    if (offset <= deadlineOffset) {
      days.push({ date: iso, weekday, capacity, sessions });
      totalCapacityToDeadline += capacity;
      for (const s of sessions) {
        minutesByGameToDeadline.set(s.gameId, (minutesByGameToDeadline.get(s.gameId) ?? 0) + s.minutes);
      }
      if (offset === deadlineOffset) {
        for (const g of queue) shortAtDeadline.set(g.id, remaining.get(g.id) ?? 0);
      }
    }
  }
  // Deadline in the past: everything is short by its full remaining time.
  if (deadlineOffset < 0) for (const g of queue) shortAtDeadline.set(g.id, Math.max(0, g.remainingMinutes));

  const outcomes: GameOutcome[] = queue.map((g) => {
    const finishDate = finishDates.get(g.id) ?? null;
    const onTime = finishDate !== null && finishDate <= deadline;
    if (onTime) usedByOnTimeGames += minutesByGameToDeadline.get(g.id) ?? 0;
    return {
      id: g.id,
      title: g.title,
      finishDate,
      onTime,
      minutesShortAtDeadline: onTime ? 0 : (shortAtDeadline.get(g.id) ?? g.remainingMinutes),
    };
  });

  const spareMinutesToDeadline = totalCapacityToDeadline - usedByOnTimeGames;

  return {
    days,
    outcomes,
    suggestions: suggest(input, outcomes, spareMinutesToDeadline, deadlineOffset),
    totalCapacityToDeadline,
    spareMinutesToDeadline,
  };
}

function suggest(
  input: PlanInput,
  outcomes: GameOutcome[],
  spareMinutes: number,
  deadlineOffset: number,
): Suggestion[] {
  const weeklyTotal = input.weeklyMinutes.reduce((a, b) => a + Math.max(0, b), 0);
  if (weeklyTotal === 0) return [{ kind: "no-time" }];

  const suggestions: Suggestion[] = [];
  const weeksLeft = Math.max(1, (deadlineOffset + 1) / 7);
  const maxDay = Math.max(...input.weeklyMinutes);
  const queued = new Set(input.queue.map((g) => g.id));
  const usedSwaps = new Set<string>();
  // Late games use up "spare" minutes too (partially played), so offer swaps that fit
  // inside the time the late game would have consumed before the deadline.
  let pool = spareMinutes;

  for (const o of outcomes) {
    if (o.onTime) continue;

    // Option 1: more free time. Round up to the nearest 15 minutes per week.
    const extra = Math.ceil(o.minutesShortAtDeadline / weeksLeft / 15) * 15;
    suggestions.push({ kind: "add-time", gameId: o.id, title: o.title, extraMinutesPerWeek: extra });

    // Option 2: swap it for the biggest backlog game that fits in the leftover time.
    const swap = (input.alternatives ?? [])
      .filter((a) => !queued.has(a.id) && !usedSwaps.has(a.id))
      .filter((a) => a.remainingMinutes > 0 && a.remainingMinutes <= pool && a.minSession <= maxDay)
      .sort((a, b) => b.remainingMinutes - a.remainingMinutes)[0];
    if (swap) {
      usedSwaps.add(swap.id);
      pool -= swap.remainingMinutes;
      suggestions.push({
        kind: "swap",
        gameId: o.id,
        title: o.title,
        swapId: swap.id,
        swapTitle: swap.title,
        swapMinutes: swap.remainingMinutes,
      });
    }
  }
  return suggestions;
}
