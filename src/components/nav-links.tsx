"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/pick", label: "🎯 Tonight's Pick" },
  { href: "/library", label: "📚 Library" },
  { href: "/plan", label: "🗺️ Campaign" },
  { href: "/stats", label: "📊 Stats" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${
            path.startsWith(l.href) ? "bg-panel-2 text-ink" : "text-muted hover:text-ink"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
