"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { savePlan } from "@/app/actions/plan";
import { buildPlan, daysBetween, type PlanGame, type Suggestion } from "@/lib/engine/planner";
import type { SavedPlan } from "@/lib/queries";

type Game = PlanGame & { hue: number };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOT_OPTIONS = [0, 30, 45, 60, 90, 120, 180, 240, 300, 360];
const MAX_TIMELINE_DAYS = 84;

const hours = (m: number) => {
  const h = m / 60;
  return h >= 10 ? `${Math.round(h)}h` : `${Math.round(h * 10) / 10}h`;
};
const prettyDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function PlanView({ games, initial, today }: { games: Game[]; initial: SavedPlan; today: string }) {
  const [week, setWeek] = useState(initial.weeklyMinutes);
  const [deadline, setDeadline] = useState(initial.deadline);
  const [queue, setQueue] = useState(initial.queue);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [pending, startTransition] = useTransition();

  const byId = useMemo(() => new Map(games.map((g) => [g.id, g])), [games]);
  const queued = queue.flatMap((id) => byId.get(id) ?? []);
  const notQueued = games.filter((g) => !queue.includes(g.id));

  // The whole plan is recomputed on every edit — the engine is pure and fast, so it runs in the browser.
  const plan = useMemo(
    () =>
      buildPlan({
        weeklyMinutes: week,
        start: today,
        deadline,
        queue: queue.flatMap((id) => byId.get(id) ?? []),
        alternatives: games.filter((g) => !queue.includes(g.id)),
      }),
    [week, today, deadline, queue, games, byId],
  );

  const dirty = JSON.stringify({ weeklyMinutes: week, deadline, queue }) !== saved;
  const weeklyTotal = week.reduce((a, b) => a + b, 0);
  const onTimeCount = plan.outcomes.filter((o) => o.onTime).length;

  const save = () =>
    startTransition(async () => {
      await savePlan({ weeklyMinutes: week, deadline, queue });
      setSaved(JSON.stringify({ weeklyMinutes: week, deadline, queue }));
    });

  const move = (i: number, dir: -1 | 1) => {
    const next = [...queue];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setQueue(next);
  };

  const apply = (s: Suggestion) => {
    if (s.kind === "swap") setQueue(queue.map((id) => (id === s.gameId ? s.swapId : id)));
    if (s.kind === "add-time") {
      // Put the extra time on the weekend, split evenly, rounded to 15 min.
      const half = Math.ceil(s.extraMinutesPerWeek / 2 / 15) * 15;
      setWeek(week.map((m, i) => (i >= 5 ? Math.min(24 * 60, m + half) : m)));
    }
  };

  if (games.length === 0) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <div className="text-4xl">🗺️</div>
        <h1 className="mt-3 text-lg font-semibold">No unfinished games to plan</h1>
        <p className="mt-1 text-sm text-muted">Add games to your backlog and come back.</p>
        <Link href="/library" className="btn-primary mt-4">
          Go to library
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Campaign Planner</h1>
          <p className="text-sm text-muted">
            {queued.length === 0
              ? "Queue some games to start planning."
              : `${onTimeCount} of ${queued.length} games finish by ${prettyDate(deadline)} · ${hours(weeklyTotal)} of gaming per week`}
          </p>
        </div>
        <button className="btn-primary" disabled={!dirty || pending} onClick={save}>
          {pending ? "Saving…" : dirty ? "Save plan" : "✓ Saved"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* ---------- Inputs ---------- */}
        <div className="space-y-4">
          <section className="card p-4">
            <h2 className="text-sm font-semibold">⏰ Free time per day</h2>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {DAYS.map((d, i) => (
                <div key={d} className="flex flex-col items-center gap-1">
                  <div className="flex h-20 w-full items-end overflow-hidden rounded-md bg-bg">
                    <div
                      className="w-full rounded-md bg-gradient-to-t from-neon to-neon-2 transition-all"
                      style={{ height: `${(week[i] / 360) * 100}%` }}
                    />
                  </div>
                  <select
                    aria-label={`${d} minutes`}
                    value={week[i]}
                    onChange={(e) => setWeek(week.map((m, j) => (j === i ? Number(e.target.value) : m)))}
                    className="w-full appearance-none rounded bg-panel-2 py-0.5 text-center text-[10px]"
                  >
                    {SLOT_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m === 0 ? "—" : hours(m)}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-muted">{d}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-4">
            <label className="text-sm font-semibold" htmlFor="deadline">
              🏁 Goal deadline
            </label>
            <input
              id="deadline"
              type="date"
              min={today}
              value={deadline}
              onChange={(e) => e.target.value && setDeadline(e.target.value)}
              className="input mt-2"
            />
            <p className="mt-1 text-xs text-muted">
              {daysBetween(today, deadline) + 1} days · {hours(plan.totalCapacityToDeadline)} of play time available
            </p>
          </section>

          <section className="card p-4">
            <h2 className="text-sm font-semibold">🎮 Queue (priority order)</h2>
            <ol className="mt-3 space-y-1.5">
              {queued.map((g, i) => (
                <li key={g.id} className="flex items-center gap-2 rounded-lg bg-panel-2 px-2 py-1.5 text-sm">
                  <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: `hsl(${g.hue} 70% 55%)` }} />
                  <span className="min-w-0 flex-1 truncate">{g.title}</span>
                  <span className="text-[11px] text-muted">{hours(g.remainingMinutes)}</span>
                  <button disabled={i === 0} onClick={() => move(i, -1)} className="text-muted hover:text-ink disabled:opacity-20" aria-label="Move up">
                    ↑
                  </button>
                  <button disabled={i === queued.length - 1} onClick={() => move(i, 1)} className="text-muted hover:text-ink disabled:opacity-20" aria-label="Move down">
                    ↓
                  </button>
                  <button onClick={() => setQueue(queue.filter((id) => id !== g.id))} className="text-muted hover:text-bad" aria-label="Remove">
                    ✕
                  </button>
                </li>
              ))}
            </ol>
            {notQueued.length > 0 && (
              <select
                value=""
                onChange={(e) => e.target.value && setQueue([...queue, e.target.value])}
                className="input mt-3 text-xs"
                aria-label="Add game to queue"
              >
                <option value="">+ Add a game to the queue…</option>
                {notQueued.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({hours(g.remainingMinutes)} left)
                  </option>
                ))}
              </select>
            )}
          </section>
        </div>

        {/* ---------- Results ---------- */}
        <div className="space-y-4">
          {queued.length > 0 && (
            <section className="card p-4">
              <h2 className="text-sm font-semibold">📅 Projected finishes</h2>
              <ul className="mt-3 space-y-2">
                {plan.outcomes.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span>{o.onTime ? "✅" : "⚠️"}</span>
                    <span className="font-medium">{o.title}</span>
                    <span className={`ml-auto text-xs ${o.onTime ? "text-good" : "text-warn"}`}>
                      {o.finishDate
                        ? `${o.onTime ? "Done" : "Late —"} ${prettyDate(o.finishDate)}`
                        : "Not within 3 years 💀"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {plan.suggestions.length > 0 && (
            <section className="card border-warn/40 p-4">
              <h2 className="text-sm font-semibold">💡 Ways to hit your goal</h2>
              <ul className="mt-3 space-y-2">
                {plan.suggestions.map((s, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-panel-2 p-2.5 text-sm">
                    <span className="flex-1">
                      {s.kind === "no-time" && "You haven't set any free time — add some hours above."}
                      {s.kind === "add-time" && (
                        <>
                          Add <b>{hours(s.extraMinutesPerWeek)}/week</b> to finish <b>{s.title}</b> on time.
                        </>
                      )}
                      {s.kind === "swap" && (
                        <>
                          Swap <b>{s.title}</b> for <b>{s.swapTitle}</b> ({hours(s.swapMinutes)}) — it fits before
                          the deadline.
                        </>
                      )}
                    </span>
                    {s.kind !== "no-time" && (
                      <button onClick={() => apply(s)} className="chip hover:border-neon">
                        Apply
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {queued.length > 0 && <Timeline plan={plan} byId={byId} />}
        </div>
      </div>
    </div>
  );
}

function Timeline({ plan, byId }: { plan: ReturnType<typeof buildPlan>; byId: Map<string, Game> }) {
  const days = plan.days.slice(0, MAX_TIMELINE_DAYS);
  // Pad the start so columns line up with weekdays (Mon first).
  const pad = days.length ? days[0].weekday : 0;
  const maxCap = Math.max(60, ...days.map((d) => d.capacity));
  return (
    <section className="card p-4">
      <h2 className="text-sm font-semibold">🗓️ Your schedule</h2>
      <div className="mt-3 grid grid-cols-7 gap-1 text-[10px] text-muted">
        {DAYS.map((d) => (
          <div key={d} className="text-center">
            {d}
          </div>
        ))}
        {Array.from({ length: pad }, (_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((d) => (
          <div
            key={d.date}
            title={
              d.sessions.map((s) => `${byId.get(s.gameId)?.title}: ${hours(s.minutes)}${s.finishes ? " 🏁" : ""}`).join("\n") ||
              "No gaming"
            }
            className="flex h-16 flex-col rounded-md bg-bg p-1"
          >
            <span>{d.date.slice(8)}</span>
            <div className="mt-auto flex flex-col-reverse gap-px overflow-hidden rounded-sm">
              {d.sessions.map((s, i) => (
                <div
                  key={i}
                  className="relative w-full"
                  style={{
                    height: `${Math.max(3, (s.minutes / maxCap) * 40)}px`,
                    background: `hsl(${byId.get(s.gameId)?.hue ?? 0} 70% 55%)`,
                  }}
                >
                  {s.finishes && <span className="absolute -top-0.5 right-0 text-[9px]">🏁</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {plan.days.length > MAX_TIMELINE_DAYS && (
        <p className="mt-2 text-[11px] text-muted">Showing the first {MAX_TIMELINE_DAYS} days.</p>
      )}
      <p className="mt-2 text-[11px] text-muted">Hover a day for details · 🏁 = game finished</p>
    </section>
  );
}
