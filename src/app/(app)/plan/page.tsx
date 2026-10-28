import { requireUser } from "@/lib/dal";
import { DEFAULT_WEEK, getLibrary, getPlan } from "@/lib/queries";
import { PlanView } from "@/components/plan-view";
import type { PlanGame } from "@/lib/engine/planner";
import { DAY_MS, isoDate, requestNow } from "@/lib/time";

export default async function PlanPage() {
  const user = await requireUser();
  const [library, saved] = await Promise.all([getLibrary(user.id), getPlan(user.id)]);

  // Only unfinished games can be planned.
  const open = library
    .filter((e) => e.status === "backlog" || e.status === "playing")
    .sort((a, b) => Number(b.status === "playing") - Number(a.status === "playing")); // in-progress first
  const games: (PlanGame & { hue: number })[] = open.map((e) => ({
    id: e.game.id,
    title: e.game.title,
    remainingMinutes: Math.round(Math.max(0, e.game.hours - e.hoursPlayed) * 60),
    minSession: e.game.minSession,
    hue: e.game.hue,
  }));

  const now = requestNow();
  const today = isoDate(now);
  const openIds = new Set(games.map((g) => g.id));
  const initial = saved
    ? { ...saved, queue: saved.queue.filter((id) => openIds.has(id)) }
    : {
        weeklyMinutes: DEFAULT_WEEK,
        deadline: isoDate(now + 42 * DAY_MS),
        queue: games.slice(0, 3).map((g) => g.id),
      };

  return <PlanView games={games} initial={initial} today={today} />;
}
