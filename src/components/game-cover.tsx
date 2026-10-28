import type { CatalogGame } from "@/data/catalog";

// Generated "box art": a gradient from the game's hue plus its initials. No image hosting needed.
export function GameCover({ game, size = "md" }: { game: CatalogGame; size?: "sm" | "md" | "lg" }) {
  const initials = game.title
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter((w) => w.length > 0 && !["the", "of", "a"].includes(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const dims = { sm: "h-12 w-9 text-[8px]", md: "h-20 w-15 text-[10px]", lg: "h-32 w-24 text-sm" }[size];
  return (
    <div
      aria-hidden
      className={`${dims} shrink-0 rounded-lg grid place-items-center font-pixel text-white/90 shadow-lg ring-1 ring-white/10`}
      style={{
        background: `linear-gradient(145deg, hsl(${game.hue} 70% 45%), hsl(${(game.hue + 40) % 360} 60% 18%))`,
      }}
    >
      {initials}
    </div>
  );
}
