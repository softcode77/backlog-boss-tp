import Link from "next/link";
import { startDemo } from "./actions/auth";
import { CATALOG } from "@/data/catalog";
import { GameCover } from "@/components/game-cover";

export default function Home() {
  const wall = CATALOG.slice(0, 18);
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 py-16 sm:py-24">
      <p className="font-pixel text-[10px] tracking-widest text-neon-2">PRESS START</p>
      <h1 className="mt-4 text-center font-pixel text-2xl leading-relaxed sm:text-4xl">
        Backlog <span className="text-neon">Boss</span>
      </h1>
      <p className="mt-6 max-w-xl text-center text-lg text-muted">
        You own 200 games and play none of them. Tell Backlog Boss how much time and energy you&apos;ve got tonight,
        and it picks the right game — then plans your campaign to actually <em className="text-ink">finish</em> things.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <form action={startDemo}>
          <button className="btn-primary w-full px-6 py-3 text-base sm:w-auto">▶ Try the demo (no signup)</button>
        </form>
        <Link href="/signup" className="btn-ghost px-6 py-3 text-base">
          Create account
        </Link>
        <Link href="/login" className="btn px-6 py-3 text-base text-muted hover:text-ink">
          Log in
        </Link>
      </div>

      <div className="mt-16 grid w-full gap-4 sm:grid-cols-3">
        {[
          ["🎯", "Tonight's Pick", "Scores your backlog on time, energy, mood and momentum — and explains every pick."],
          ["🧠", "Learns your taste", "Every “not tonight” teaches it. Skip three long RPGs and it gets the hint."],
          ["🗺️", "Campaign Planner", "Fits games into your real weekly free time and warns you before you miss a goal."],
        ].map(([icon, title, body]) => (
          <div key={title} className="card p-5">
            <div className="text-2xl">{icon}</div>
            <h2 className="mt-3 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 flex flex-wrap justify-center gap-2 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]">
        {wall.map((g) => (
          <GameCover key={g.id} game={g} />
        ))}
      </div>
    </main>
  );
}
