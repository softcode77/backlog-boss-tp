"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CATALOG } from "@/data/catalog";
import { STATUSES, type Status } from "@/lib/status";
import type { LibraryItem } from "@/lib/queries";
import { addGame, loadSampleLibrary, logSession, removeEntry, updateEntry } from "@/app/actions/library";
import { GameCover } from "./game-cover";
import { DAY_MS } from "@/lib/time";

export const STATUS_STYLE: Record<Status, { label: string; className: string }> = {
  backlog: { label: "Backlog", className: "bg-slate-500/20 text-slate-300 border-slate-500/40" },
  playing: { label: "Playing", className: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40" },
  finished: { label: "Finished", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
  dropped: { label: "Dropped", className: "bg-red-500/15 text-red-300 border-red-500/40" },
};

type Filter = Status | "all";
type Sort = "recent" | "oldest" | "shortest" | "longest";

export function LibraryView({ library, now }: { library: LibraryItem[]; now: number }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [showAdd, setShowAdd] = useState(library.length === 0);
  const [pending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: library.length, backlog: 0, playing: 0, finished: 0, dropped: 0 };
    for (const e of library) c[e.status]++;
    return c;
  }, [library]);

  const visible = useMemo(() => {
    const list = library.filter((e) => filter === "all" || e.status === filter);
    const remaining = (e: LibraryItem) => Math.max(0, e.game.hours - e.hoursPlayed);
    return [...list].sort((a, b) => {
      if (sort === "oldest") return a.addedAt.getTime() - b.addedAt.getTime();
      if (sort === "shortest") return remaining(a) - remaining(b);
      if (sort === "longest") return remaining(b) - remaining(a);
      return 0; // "recent" — already ordered by updatedAt from the server
    });
  }, [library, filter, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Your Library</h1>
          <p className="text-sm text-muted">
            {counts.backlog + counts.playing} games waiting on you ·{" "}
            {Math.round(
              library
                .filter((e) => e.status === "backlog" || e.status === "playing")
                .reduce((s, e) => s + Math.max(0, e.game.hours - e.hoursPlayed), 0),
            )}
            h of content left
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/pick" className="btn-ghost">
            🎯 Pick for tonight
          </Link>
          <button className="btn-primary" onClick={() => setShowAdd((s) => !s)}>
            {showAdd ? "Close" : "+ Add games"}
          </button>
        </div>
      </div>

      {showAdd && <AddGames owned={new Set(library.map((e) => e.game.id))} />}

      {library.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl">🕹️</div>
          <h2 className="mt-3 text-lg font-semibold">Your shelf is empty</h2>
          <p className="mt-1 text-sm text-muted">Hit “+ Add games”, or load a sample backlog to explore.</p>
          <button
            className="btn-ghost mt-4"
            disabled={pending}
            onClick={() => startTransition(() => loadSampleLibrary())}
          >
            {pending ? "Loading…" : "Load a sample library"}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {(["all", ...STATUSES] as Filter[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`chip ${filter === f ? "chip-on" : "text-muted"}`}>
                {f === "all" ? "All" : STATUS_STYLE[f].label} <span className="opacity-60">{counts[f]}</span>
              </button>
            ))}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="input ml-auto w-auto py-1 text-xs"
              aria-label="Sort"
            >
              <option value="recent">Recently updated</option>
              <option value="oldest">Longest in backlog</option>
              <option value="shortest">Shortest remaining</option>
              <option value="longest">Longest remaining</option>
            </select>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {visible.map((e) => (
              <EntryCard key={e.id} entry={e} now={now} />
            ))}
          </div>
          {visible.length === 0 && <p className="text-center text-sm text-muted">Nothing here yet.</p>}
        </>
      )}
    </div>
  );
}

function EntryCard({ entry, now }: { entry: LibraryItem; now: number }) {
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<void>) => startTransition(fn);
  const progress = Math.min(1, entry.hoursPlayed / entry.game.hours);
  const daysWaiting = Math.floor((now - entry.addedAt.getTime()) / DAY_MS);

  return (
    <div className={`card flex gap-4 p-4 transition ${pending ? "opacity-60" : ""}`}>
      <GameCover game={entry.game} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{entry.game.title}</h3>
            <p className="truncate text-xs text-muted">
              {entry.game.year} · {entry.game.genres.join(", ")} · ~{entry.game.hours}h
            </p>
          </div>
          <select
            value={entry.status}
            disabled={pending}
            onChange={(e) => run(() => updateEntry(entry.id, { status: e.target.value as Status }))}
            className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLE[entry.status].className}`}
            aria-label="Status"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-panel text-ink">
                {STATUS_STYLE[s].label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="h-1.5 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-gradient-to-r from-neon to-neon-2"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted">
            {entry.hoursPlayed.toFixed(1)}h / ~{entry.game.hours}h ({Math.round(progress * 100)}%)
            {entry.status === "backlog" && daysWaiting > 7 && ` · waiting ${daysWaiting} days`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(entry.status === "backlog" || entry.status === "playing") && (
            <>
              <span className="text-[11px] text-muted">Log:</span>
              {[30, 60, 120].map((m) => (
                <button
                  key={m}
                  disabled={pending}
                  onClick={() => run(() => logSession(entry.id, m))}
                  className="chip text-muted hover:border-neon-2 hover:text-ink"
                >
                  +{m >= 60 ? `${m / 60}h` : `${m}m`}
                </button>
              ))}
            </>
          )}
          {(entry.status === "finished" || entry.status === "dropped") && (
            <Stars
              value={entry.rating}
              onChange={(rating) => run(() => updateEntry(entry.id, { rating }))}
              disabled={pending}
            />
          )}
          <button
            disabled={pending}
            onClick={() => run(() => removeEntry(entry.id))}
            className="ml-auto text-[11px] text-muted hover:text-bad"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function Stars({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          disabled={disabled}
          onClick={() => onChange(value === n ? null : n)}
          className={`px-0.5 text-base ${value && n <= value ? "text-warn" : "text-line hover:text-warn/60"}`}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function AddGames({ owned }: { owned: Set<string> }) {
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((g) => !owned.has(g.id))
      .filter((g) => !q || g.title.toLowerCase().includes(q) || g.genres.some((x) => x.toLowerCase().includes(q)))
      .slice(0, 12);
  }, [query, owned]);

  const add = (id: string, status: Status) => {
    setBusyId(id);
    startTransition(async () => {
      await addGame(id, status);
      setBusyId(null);
    });
  };

  return (
    <div className="card space-y-4 p-4">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by title or genre — try “soulslike” or “cozy”"
        className="input"
      />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((g) => (
          <div key={g.id} className={`flex items-center gap-3 rounded-xl bg-panel-2 p-2 ${busyId === g.id ? "opacity-50" : ""}`}>
            <GameCover game={g} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{g.title}</p>
              <p className="truncate text-[11px] text-muted">
                {g.genres[0]} · ~{g.hours}h
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <button disabled={pending} onClick={() => add(g.id, "backlog")} className="chip text-[10px] hover:border-neon">
                + Backlog
              </button>
              <button disabled={pending} onClick={() => add(g.id, "finished")} className="chip text-[10px] text-muted hover:border-good">
                ✓ Beaten
              </button>
            </div>
          </div>
        ))}
      </div>
      {results.length === 0 && <p className="text-center text-sm text-muted">No matches in the catalog.</p>}
    </div>
  );
}
