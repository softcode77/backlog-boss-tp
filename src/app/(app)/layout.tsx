import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { logout } from "@/app/actions/auth";
import { NavLinks } from "@/components/nav-links";

// "(app)" is a route group: it groups the logged-in pages under one layout without adding
// "/app" to the URL.
//
// Cache Components is on, so the static chrome (logo, nav) is prerendered and loads instantly.
// Anything that reads the session cookie sits inside a <Suspense> boundary and streams in per request.
// Each page calls requireUser() itself, which is what actually protects it.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/library" className="font-pixel text-xs">
            Backlog <span className="text-neon">Boss</span>
          </Link>
          <NavLinks />
          <div className="ml-auto flex items-center gap-3 text-sm">
            <Suspense fallback={<span className="h-4 w-24 animate-pulse rounded bg-panel-2" />}>
              <UserBadge />
            </Suspense>
            <form action={logout}>
              <button className="text-muted hover:text-ink">Log out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
      </main>
    </div>
  );
}

async function UserBadge() {
  const user = await getCurrentUser();
  return (
    <span className="text-muted">
      🎮 <span className="text-ink">{user?.username}</span>
    </span>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-panel-2" />
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card h-28 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
