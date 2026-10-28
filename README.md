# 🎮 Backlog Boss

**You own 200 games and play none of them.** Backlog Boss tells you what to play *tonight*, based on how much time and energy you have, learns your taste from every "not tonight", and plans a campaign so you actually finish games.

> **Try it:** open the app and click **"▶ Try the demo"**. It creates a throwaway account with a pre-filled backlog, so you can explore everything immediately.

## What it does

| Feature | What's interesting about it |
|---|---|
| 🎯 **Tonight's Pick** | Scores every unfinished game on 7 factors (session fit, energy, mood, momentum, backlog age, learned taste, recent snoozes) and **explains** the pick. "Show the math" reveals the full score breakdown. |
| 🧠 **Learns your taste** | Each "Play this" / "Not tonight" updates per-feature affinities (genre, length, intensity) with **exponential time decay** (14-day half-life) and smoothing, so one click doesn't swing everything. |
| 🗺️ **Campaign Planner** | Simulates your real weekly free time day by day, gives the evening to the top-priority game, and slots in a shorter game when the leftover time is too short. It projects finish dates, flags games that miss your deadline, and suggests one-click fixes ("add 1.5h/week" or "swap X for Y, it fits"). Recomputes live in the browser as you edit. |
| 📚 **Library** | Search a built-in catalog of 70 games, track status, log play sessions, rate finished games, and filter or sort. |
| 📊 **Backlog Health** | Completion rate, hours left, time to clear at your pace, and **"will you actually finish it?"** odds per game, from your own finish rate by game length. |

## Running locally

Requires Node 22+.

```bash
npm install
cp .env.example .env.local        # then set SESSION_SECRET (command is in the file)
npm run db:push                   # creates the local SQLite database (local.db)
npm run dev                       # http://localhost:3000
```

Other scripts: `npm test` (engine unit tests), `npm run typecheck`, `npm run lint`, `npm run build`.

## Deploying (Vercel + Turso)

1. Create a free Turso database: `turso db create backlog-boss`, then get its URL and a token (`turso db show --url`, `turso db tokens create`).
2. Push the schema to it: `DATABASE_URL=... DATABASE_AUTH_TOKEN=... npm run db:push`.
3. Import the repo in Vercel and set the env vars `SESSION_SECRET`, `DATABASE_URL`, `DATABASE_AUTH_TOKEN`.

---

## Architecture (a tour for someone new to Next.js)

```
Browser                         Server (Next.js)                        Storage
───────                         ────────────────                        ───────
                ┌──────────────────────────────────────────┐
 request ─────► │ proxy.ts       cheap cookie check,       │
                │                early redirects           │
                └──────────────┬───────────────────────────┘
                               ▼
                ┌──────────────────────────────────────────┐
 HTML/stream ◄──│ Server Components  app/**/page.tsx       │
                │   requireUser() ─► lib/dal.ts ───────────┼──► users
                │   getLibrary()  ─► lib/queries.ts ───────┼──► library_entries, ...
                │   engines       ─► lib/engine/*.ts       │    (SQLite / Turso
                └──────────────┬───────────────────────────┘     via Drizzle ORM)
                               │ props (plain data)
                               ▼
 clicks ──────► Client Components  components/*-view.tsx
                  (state, interactivity)
                       │  call
                       ▼
                Server Actions  app/actions/*.ts ──── requireUser + zod ──► DB writes
                       │  revalidatePath() → page re-renders with fresh data
```

### Key ideas

- **Server Components (default).** Files in `src/app/**/page.tsx` run **on the server**. They can query the database directly, and their code never reaches the browser. Example: [library/page.tsx](src/app/(app)/library/page.tsx).
- **Client Components (`"use client"`).** Run in the browser too, so they can use state and click handlers. Server pages fetch the data and pass it to them as props. Example: [library-view.tsx](src/components/library-view.tsx).
- **Server Actions (`"use server"`).** Functions the browser can call like normal functions, but they run on the server. All writes go through them ([actions/](src/app/actions/)). Each one checks the user, validates input with zod, and scopes the query to that user's rows, because under the hood they are public HTTP endpoints.
- **Auth** is a signed JWT in an httpOnly cookie ([lib/session.ts](src/lib/session.ts)), checked in two layers:
  1. [proxy.ts](src/proxy.ts) does a fast, optimistic redirect for logged-out visitors.
  2. [lib/dal.ts](src/lib/dal.ts) (the Data Access Layer) does the real check before any data is read. Passwords are hashed with bcrypt.
- **Route group `(app)`.** The folder name in parentheses doesn't appear in the URL. It just lets all logged-in pages share [one layout](src/app/(app)/layout.tsx) with the nav bar.
- **Cache Components / streaming.** Next 16 prerenders static parts (logo, nav) and streams user-specific parts inside `<Suspense>`, so pages show a skeleton instantly.
- **The engines are plain TypeScript.** [picker.ts](src/lib/engine/picker.ts), [planner.ts](src/lib/engine/planner.ts) and [stats.ts](src/lib/engine/stats.ts) have no React and no database, only pure functions. That makes them unit-testable ([*.test.ts](src/lib/engine/)) and lets the planner run on the server *or* in the browser.

### Folder map

```
src/
  app/
    page.tsx              landing page (static)
    login/, signup/       auth pages
    logout/route.ts       clears the cookie (route handler)
    (app)/                logged-in area: shared layout + library, pick, plan, stats
    actions/              Server Actions (all writes)
  components/             Client Components (interactive UI)
  data/catalog.ts         built-in game catalog + demo library
  db/                     Drizzle schema + client
  lib/
    engine/               picker, planner, stats (+ tests)
    session.ts, dal.ts    auth
    queries.ts            read helpers (always scoped by userId)
  proxy.ts                early redirects
```

## Status

**Works:** sign up / log in / log out, one-click demo, library CRUD with session logging and ratings, picker with explanations and learning from feedback, campaign planner with live recompute, suggestions and saving, stats with finish odds, 12 unit tests on the engines.

**Not done yet / next steps:**
- Real game data (RAWG or IGDB search, Steam library import). The catalog is built in so the demo has no API keys to break.
- Logging a session doesn't yet feed back into the picker (accepting a pick could open a "how long did you play?" prompt).
- Social: share your plan, compare backlogs with friends.
- No rate limiting on login, and demo accounts are never cleaned up.
