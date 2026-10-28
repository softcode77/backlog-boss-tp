import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { DEFAULT_WEEK, getLibrary, getPlan } from "@/lib/queries";
import { computeStats } from "@/lib/engine/stats";

function clearTimeLabel(weeks: number | null) {
  if (weeks === null) return "∞";
  if (weeks < 8) return `${Math.ceil(weeks)} weeks`;
  if (weeks < 104) return `${Math.round(weeks / 4.345)} months`;
  return `${(weeks / 52).toFixed(1)} years`;
}

function roast(weeks: number | null, completion: number | null) {
  if (weeks === null) return "Set some free time in the Campaign planner to see this.";
  if (weeks > 104) return "Your backlog will outlive your current console. 💀";
  if (weeks > 52) return "That's a whole year of evenings. Maybe stop buying games in sales?";
  if (completion !== null && completion < 0.5) return "You drop more than you finish. The picker can help.";
  return "Honestly? Very manageable. GG.";
}

export default async function StatsPage() {
  const user = await requireUser();
  const [library, plan] = await Promise.all([getLibrary(user.id), getPlan(user.id)]);
  const weekly = (plan?.weeklyMinutes ?? DEFAULT_WEEK).reduce((a, b) => a + b, 0);
  const stats = computeStats(library, weekly);

  if (stats.total === 0) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <div className="text-4xl">📊</div>
        <h1 className="mt-3 text-lg font-semibold">No stats yet</h1>
        <Link href="/library" className="btn-primary mt-4">
          Build your library
        </Link>
      </div>
    );
  }

  const tiles = [
    { label: "Games tracked", value: String(stats.total) },
    {
      label: "Completion rate",
      value: stats.completionRate === null ? "—" : `${Math.round(stats.completionRate * 100)}%`,
      hint: `${stats.counts.finished} finished · ${stats.counts.dropped} dropped`,
    },
    { label: "Hours left", value: `${Math.round(stats.hoursRemaining)}h`, hint: `${stats.counts.backlog + stats.counts.playing} games` },
    { label: "Time to clear", value: clearTimeLabel(stats.weeksToClear), hint: `at ${Math.round(weekly / 60)}h/week` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Backlog Health</h1>
        <p className="text-sm text-muted">{roast(stats.weeksToClear, stats.completionRate)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-4">
            <p className="text-xs text-muted">{t.label}</p>
            <p className="mt-1 text-2xl font-bold">{t.value}</p>
            {t.hint && <p className="mt-1 text-[11px] text-muted">{t.hint}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="card p-5">
          <h2 className="font-semibold">🔮 Will you actually finish it?</h2>
          <p className="mt-1 text-xs text-muted">
            Based on your finish rate for games of similar length, plus progress so far. Lowest odds first.
          </p>
          <ul className="mt-4 space-y-3">
            {stats.odds.map((o) => {
              const pct = Math.round(o.odds * 100);
              const color = pct >= 65 ? "bg-good" : pct >= 40 ? "bg-warn" : "bg-bad";
              return (
                <li key={o.gameId}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{o.title}</span>
                    <span className="font-mono text-xs">{pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted">{o.reason}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="space-y-4">
          <section className="card p-5">
            <h2 className="font-semibold">Library breakdown</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {(["playing", "backlog", "finished", "dropped"] as const).map((s) => (
                <li key={s} className="flex justify-between capitalize">
                  <span className="text-muted">{s}</span>
                  <span>{stats.counts[s]}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="card p-5">
            <h2 className="font-semibold">Top genres</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {stats.topGenres.map((g) => (
                <li key={g.genre} className="flex justify-between">
                  <span className="text-muted">{g.genre}</span>
                  <span>{g.count}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
