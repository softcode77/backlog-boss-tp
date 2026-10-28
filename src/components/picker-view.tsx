"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MOODS } from "@/data/catalog";
import { getPicks, recordFeedback, type PickResult } from "@/app/actions/picker";
import {
  DEFAULT_CONTEXT,
  mainDrawback,
  topReasons,
  type Energy,
  type PickContext as Ctx,
  type ScoredPick,
} from "@/lib/engine/picker";
import { GameCover } from "./game-cover";

const TIME_PRESETS = [30, 45, 60, 90, 120, 180];
const ENERGY: { id: Energy; label: string }[] = [
  { id: "low", label: "😴 Tired" },
  { id: "medium", label: "🙂 Normal" },
  { id: "high", label: "⚡ Hyped" },
];

function formatMinutes(m: number) {
  return m < 60 ? `${m} min` : `${m / 60}h`.replace(".5h", "½h");
}

export function PickerView({ initial }: { initial: PickResult }) {
  const [ctx, setCtx] = useState<Ctx>(DEFAULT_CONTEXT);
  const [result, setResult] = useState<PickResult>(initial);
  const [accepted, setAccepted] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const rerun = (next: Ctx) => {
    setCtx(next);
    setAccepted(null);
    startTransition(async () => setResult(await getPicks(next)));
  };

  const playable = result.picks.filter((p) => !p.blocked);
  const blocked = result.picks.filter((p) => p.blocked);
  const [top, ...rest] = playable;

  const feedback = (pick: ScoredPick, yes: boolean) =>
    startTransition(async () => {
      await recordFeedback(pick.game.id, yes);
      if (yes) setAccepted(pick.game.title);
      // Re-score: a rejection snoozes this game and nudges learned taste.
      setResult(await getPicks(ctx));
    });

  if (result.candidateCount === 0) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <div className="text-4xl">📭</div>
        <h1 className="mt-3 text-lg font-semibold">Nothing to pick from yet</h1>
        <p className="mt-1 text-sm text-muted">Add some unplayed games to your library first.</p>
        <Link href="/library" className="btn-primary mt-4">
          Go to library
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <section className="card space-y-5 p-5">
          <h1 className="text-xl font-bold">What should I play tonight?</h1>

          <Control label="How long have you got?">
            {TIME_PRESETS.map((m) => (
              <button
                key={m}
                onClick={() => rerun({ ...ctx, minutes: m })}
                className={`chip ${ctx.minutes === m ? "chip-on" : "text-muted"}`}
              >
                {formatMinutes(m)}
              </button>
            ))}
          </Control>
          <Control label="Energy level">
            {ENERGY.map((e) => (
              <button
                key={e.id}
                onClick={() => rerun({ ...ctx, energy: e.id })}
                className={`chip ${ctx.energy === e.id ? "chip-on" : "text-muted"}`}
              >
                {e.label}
              </button>
            ))}
          </Control>
          <Control label="In the mood for">
            <button
              onClick={() => rerun({ ...ctx, mood: "any" })}
              className={`chip ${ctx.mood === "any" ? "chip-on" : "text-muted"}`}
            >
              🎲 Anything
            </button>
            {MOODS.map((m) => (
              <button
                key={m.id}
                onClick={() => rerun({ ...ctx, mood: m.id })}
                className={`chip ${ctx.mood === m.id ? "chip-on" : "text-muted"}`}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </Control>
        </section>

        <div className={`space-y-6 transition ${pending ? "opacity-50" : ""}`}>
          {accepted && (
            <div className="card border-good/50 p-4 text-sm">
              🎮 <span className="font-semibold">GLHF!</span> Enjoy {accepted}. Log your session in the{" "}
              <Link href="/library" className="text-neon-2 hover:underline">
                library
              </Link>{" "}
              when you&apos;re done — the planner uses it.
            </div>
          )}

          {top ? (
            <TopPick pick={top} onYes={() => feedback(top, true)} onNo={() => feedback(top, false)} pending={pending} />
          ) : (
            <div className="card p-8 text-center text-sm text-muted">
              Nothing in your backlog fits in {formatMinutes(ctx.minutes)}. Try giving yourself more time.
            </div>
          )}

          {rest.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-muted">Also considered</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {rest.slice(0, 3).map((p) => (
                  <RunnerUp key={p.game.id} pick={p} />
                ))}
              </div>
            </section>
          )}

          {blocked.length > 0 && (
            <p className="text-xs text-muted">
              ⏱️ Skipped {blocked.length} game{blocked.length > 1 ? "s" : ""} that need a longer session:{" "}
              {blocked
                .slice(0, 4)
                .map((p) => p.game.title)
                .join(", ")}
              {blocked.length > 4 && "…"}
            </p>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card p-5">
          <h2 className="font-semibold">🧠 What I&apos;ve learned about you</h2>
          {result.insights.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              Nothing yet. Every “Play this” and “Not tonight” teaches me your taste.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {result.insights.map((i) => (
                <li key={i.feature} className="flex items-start gap-2 text-sm">
                  <span className={i.affinity > 0 ? "text-good" : "text-bad"}>{i.affinity > 0 ? "▲" : "▼"}</span>
                  <span>
                    {i.text}
                    <AffinityBar value={i.affinity} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card p-5 text-xs leading-relaxed text-muted">
          <p className="font-semibold text-ink">How picks work</p>
          <p className="mt-1">
            Each game is scored on session fit, energy, mood, momentum, how long it&apos;s waited, and your learned
            taste. Recent feedback counts more (14-day half-life). “Not tonight” snoozes a game for 12 hours.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function TopPick({
  pick,
  onYes,
  onNo,
  pending,
}: {
  pick: ScoredPick;
  onYes: () => void;
  onNo: () => void;
  pending: boolean;
}) {
  const [showMath, setShowMath] = useState(false);
  return (
    <section className="card relative overflow-hidden p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{ background: `radial-gradient(600px 300px at 0% 0%, hsl(${pick.game.hue} 80% 50%), transparent 70%)` }}
      />
      <div className="relative flex flex-col gap-6 sm:flex-row">
        <GameCover game={pick.game} size="lg" />
        <div className="flex-1 space-y-4">
          <div>
            <p className="font-pixel text-[10px] tracking-widest text-neon-2">TONIGHT&apos;S PICK</p>
            <h2 className="mt-2 text-2xl font-bold">{pick.game.title}</h2>
            <p className="text-sm text-muted">
              {pick.status === "playing" ? "In progress" : "From your backlog"} · {pick.game.genres.join(", ")} · ~
              {pick.game.hours}h · intensity {pick.game.intensity}/5
            </p>
          </div>
          <ul className="space-y-1.5">
            {topReasons(pick).map((f) => (
              <li key={f.label} className="flex items-center gap-2 text-sm">
                <span className="text-good">✔</span> {f.note}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" disabled={pending} onClick={onYes}>
              ▶ Play this
            </button>
            <button className="btn-ghost" disabled={pending} onClick={onNo}>
              Not tonight
            </button>
            <button className="btn text-muted hover:text-ink" onClick={() => setShowMath((s) => !s)}>
              {showMath ? "Hide" : "Show"} the math
            </button>
          </div>
          {showMath && <ScoreBreakdown pick={pick} />}
        </div>
      </div>
    </section>
  );
}

function ScoreBreakdown({ pick }: { pick: ScoredPick }) {
  return (
    <div className="rounded-xl bg-bg/60 p-3">
      <table className="w-full text-xs">
        <tbody>
          {pick.factors.map((f) => (
            <tr key={f.label} className="border-b border-line/50 last:border-0">
              <td className="py-1.5 pr-2 font-medium">{f.label}</td>
              <td className="py-1.5 pr-2 text-muted">{f.note}</td>
              <td className={`py-1.5 text-right font-mono ${f.points >= 0 ? "text-good" : "text-bad"}`}>
                {f.points > 0 ? "+" : ""}
                {f.points}
              </td>
            </tr>
          ))}
          <tr>
            <td className="pt-2 font-semibold" colSpan={2}>
              Total
            </td>
            <td className="pt-2 text-right font-mono font-semibold">{pick.score}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function RunnerUp({ pick }: { pick: ScoredPick }) {
  const drawback = mainDrawback(pick);
  return (
    <div className="card flex gap-3 p-3">
      <GameCover game={pick.game} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{pick.game.title}</p>
        <p className="text-[11px] text-muted">Score {pick.score}</p>
        {drawback && <p className="mt-1 text-[11px] text-bad/90">✗ {drawback.note}</p>}
      </div>
    </div>
  );
}

function AffinityBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.abs(value) * 100);
  return (
    <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-bg">
      <span
        className={`block h-full rounded-full ${value > 0 ? "bg-good" : "bg-bad"}`}
        style={{ width: `${pct}%` }}
      />
    </span>
  );
}
