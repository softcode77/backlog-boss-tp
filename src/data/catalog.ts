// The built-in game catalog. Hours are rough "main story" estimates (HowLongToBeat-style).
// Keeping this in code means the app has zero external API dependencies for the demo.

export type Mood = "chill" | "story" | "action" | "challenge" | "brainy";

export const MOODS: { id: Mood; label: string; emoji: string }[] = [
  { id: "chill", label: "Chill", emoji: "🌿" },
  { id: "story", label: "Story", emoji: "📖" },
  { id: "action", label: "Action", emoji: "💥" },
  { id: "challenge", label: "Challenge", emoji: "💀" },
  { id: "brainy", label: "Brainy", emoji: "🧠" },
];

export type CatalogGame = {
  id: string;
  title: string;
  year: number;
  genres: string[];
  /** Hours to finish the main content. */
  hours: number;
  /** 1 = relaxing, 5 = sweaty-palms intense. */
  intensity: 1 | 2 | 3 | 4 | 5;
  /** Shortest session (minutes) where you actually make progress. */
  minSession: number;
  moods: Mood[];
  /** Hue (0-360) used to draw the generated cover art. */
  hue: number;
};

export const CATALOG: CatalogGame[] = [
  { id: "elden-ring", title: "Elden Ring", year: 2022, genres: ["Action RPG", "Open World"], hours: 58, intensity: 5, minSession: 60, moods: ["challenge", "action"], hue: 42 },
  { id: "hades", title: "Hades", year: 2020, genres: ["Roguelike", "Action"], hours: 22, intensity: 4, minSession: 25, moods: ["action", "challenge"], hue: 350 },
  { id: "hades-2", title: "Hades II", year: 2025, genres: ["Roguelike", "Action"], hours: 30, intensity: 4, minSession: 25, moods: ["action", "challenge"], hue: 280 },
  { id: "stardew-valley", title: "Stardew Valley", year: 2016, genres: ["Farming Sim", "Cozy"], hours: 53, intensity: 1, minSession: 20, moods: ["chill"], hue: 110 },
  { id: "witcher-3", title: "The Witcher 3: Wild Hunt", year: 2015, genres: ["RPG", "Open World"], hours: 52, intensity: 3, minSession: 60, moods: ["story", "action"], hue: 0 },
  { id: "baldurs-gate-3", title: "Baldur's Gate 3", year: 2023, genres: ["RPG", "Turn-Based"], hours: 75, intensity: 2, minSession: 75, moods: ["story", "brainy"], hue: 15 },
  { id: "celeste", title: "Celeste", year: 2018, genres: ["Platformer", "Indie"], hours: 8, intensity: 5, minSession: 20, moods: ["challenge"], hue: 320 },
  { id: "hollow-knight", title: "Hollow Knight", year: 2017, genres: ["Metroidvania", "Indie"], hours: 27, intensity: 4, minSession: 40, moods: ["challenge", "action"], hue: 220 },
  { id: "silksong", title: "Hollow Knight: Silksong", year: 2025, genres: ["Metroidvania", "Indie"], hours: 30, intensity: 5, minSession: 40, moods: ["challenge", "action"], hue: 5 },
  { id: "disco-elysium", title: "Disco Elysium", year: 2019, genres: ["RPG", "Narrative"], hours: 22, intensity: 1, minSession: 45, moods: ["story", "brainy"], hue: 190 },
  { id: "outer-wilds", title: "Outer Wilds", year: 2019, genres: ["Exploration", "Mystery"], hours: 17, intensity: 2, minSession: 40, moods: ["brainy", "story"], hue: 30 },
  { id: "portal-2", title: "Portal 2", year: 2011, genres: ["Puzzle", "First-Person"], hours: 9, intensity: 2, minSession: 25, moods: ["brainy"], hue: 200 },
  { id: "red-dead-2", title: "Red Dead Redemption 2", year: 2018, genres: ["Action Adventure", "Open World"], hours: 50, intensity: 3, minSession: 90, moods: ["story"], hue: 12 },
  { id: "gow-ragnarok", title: "God of War Ragnarök", year: 2022, genres: ["Action Adventure"], hours: 26, intensity: 4, minSession: 60, moods: ["action", "story"], hue: 205 },
  { id: "spider-man-2", title: "Marvel's Spider-Man 2", year: 2023, genres: ["Action Adventure", "Open World"], hours: 18, intensity: 3, minSession: 40, moods: ["action", "story"], hue: 355 },
  { id: "zelda-totk", title: "Zelda: Tears of the Kingdom", year: 2023, genres: ["Action Adventure", "Open World"], hours: 59, intensity: 2, minSession: 45, moods: ["chill", "brainy"], hue: 150 },
  { id: "zelda-botw", title: "Zelda: Breath of the Wild", year: 2017, genres: ["Action Adventure", "Open World"], hours: 50, intensity: 2, minSession: 45, moods: ["chill", "brainy"], hue: 170 },
  { id: "mario-odyssey", title: "Super Mario Odyssey", year: 2017, genres: ["Platformer"], hours: 12, intensity: 2, minSession: 20, moods: ["chill", "action"], hue: 0 },
  { id: "animal-crossing", title: "Animal Crossing: New Horizons", year: 2020, genres: ["Life Sim", "Cozy"], hours: 60, intensity: 1, minSession: 15, moods: ["chill"], hue: 140 },
  { id: "sekiro", title: "Sekiro: Shadows Die Twice", year: 2019, genres: ["Action", "Soulslike"], hours: 30, intensity: 5, minSession: 45, moods: ["challenge", "action"], hue: 0 },
  { id: "dark-souls-3", title: "Dark Souls III", year: 2016, genres: ["Action RPG", "Soulslike"], hours: 32, intensity: 5, minSession: 60, moods: ["challenge", "action"], hue: 25 },
  { id: "bloodborne", title: "Bloodborne", year: 2015, genres: ["Action RPG", "Soulslike"], hours: 34, intensity: 5, minSession: 60, moods: ["challenge", "action"], hue: 345 },
  { id: "persona-5", title: "Persona 5 Royal", year: 2020, genres: ["JRPG", "Turn-Based"], hours: 103, intensity: 2, minSession: 60, moods: ["story"], hue: 355 },
  { id: "ff7-rebirth", title: "Final Fantasy VII Rebirth", year: 2024, genres: ["JRPG", "Action RPG"], hours: 46, intensity: 3, minSession: 60, moods: ["story", "action"], hue: 260 },
  { id: "cyberpunk", title: "Cyberpunk 2077", year: 2020, genres: ["RPG", "Open World", "Shooter"], hours: 25, intensity: 3, minSession: 60, moods: ["story", "action"], hue: 55 },
  { id: "mass-effect-le", title: "Mass Effect Legendary Edition", year: 2021, genres: ["RPG", "Shooter"], hours: 60, intensity: 3, minSession: 60, moods: ["story", "action"], hue: 210 },
  { id: "doom-eternal", title: "DOOM Eternal", year: 2020, genres: ["Shooter", "Action"], hours: 14, intensity: 5, minSession: 30, moods: ["action"], hue: 10 },
  { id: "doom-dark-ages", title: "DOOM: The Dark Ages", year: 2025, genres: ["Shooter", "Action"], hours: 20, intensity: 5, minSession: 30, moods: ["action"], hue: 20 },
  { id: "half-life-alyx", title: "Half-Life: Alyx", year: 2020, genres: ["Shooter", "VR"], hours: 12, intensity: 4, minSession: 40, moods: ["action", "story"], hue: 30 },
  { id: "inside", title: "Inside", year: 2016, genres: ["Puzzle Platformer", "Indie"], hours: 3.5, intensity: 3, minSession: 30, moods: ["brainy", "story"], hue: 0 },
  { id: "limbo", title: "Limbo", year: 2010, genres: ["Puzzle Platformer", "Indie"], hours: 3.5, intensity: 3, minSession: 25, moods: ["brainy"], hue: 0 },
  { id: "journey", title: "Journey", year: 2012, genres: ["Adventure", "Indie"], hours: 2.5, intensity: 1, minSession: 30, moods: ["chill", "story"], hue: 35 },
  { id: "what-remains-of-edith-finch", title: "What Remains of Edith Finch", year: 2017, genres: ["Narrative", "Walking Sim"], hours: 2.5, intensity: 1, minSession: 30, moods: ["story", "chill"], hue: 95 },
  { id: "unpacking", title: "Unpacking", year: 2021, genres: ["Puzzle", "Cozy"], hours: 4, intensity: 1, minSession: 15, moods: ["chill", "brainy"], hue: 30 },
  { id: "a-short-hike", title: "A Short Hike", year: 2019, genres: ["Exploration", "Cozy"], hours: 2, intensity: 1, minSession: 20, moods: ["chill"], hue: 130 },
  { id: "tunic", title: "Tunic", year: 2022, genres: ["Action Adventure", "Indie"], hours: 12, intensity: 4, minSession: 30, moods: ["brainy", "challenge"], hue: 160 },
  { id: "dead-cells", title: "Dead Cells", year: 2018, genres: ["Roguelike", "Metroidvania"], hours: 15, intensity: 4, minSession: 20, moods: ["action", "challenge"], hue: 300 },
  { id: "slay-the-spire", title: "Slay the Spire", year: 2019, genres: ["Roguelike", "Deckbuilder"], hours: 30, intensity: 2, minSession: 20, moods: ["brainy", "chill"], hue: 270 },
  { id: "balatro", title: "Balatro", year: 2024, genres: ["Roguelike", "Deckbuilder"], hours: 20, intensity: 2, minSession: 15, moods: ["brainy", "chill"], hue: 330 },
  { id: "vampire-survivors", title: "Vampire Survivors", year: 2022, genres: ["Roguelike", "Action"], hours: 15, intensity: 2, minSession: 15, moods: ["chill", "action"], hue: 285 },
  { id: "into-the-breach", title: "Into the Breach", year: 2018, genres: ["Strategy", "Turn-Based"], hours: 10, intensity: 2, minSession: 20, moods: ["brainy"], hue: 15 },
  { id: "xcom-2", title: "XCOM 2", year: 2016, genres: ["Strategy", "Turn-Based"], hours: 37, intensity: 3, minSession: 45, moods: ["brainy", "challenge"], hue: 195 },
  { id: "civ-6", title: "Civilization VI", year: 2016, genres: ["Strategy", "4X"], hours: 40, intensity: 1, minSession: 60, moods: ["brainy", "chill"], hue: 45 },
  { id: "factorio", title: "Factorio", year: 2020, genres: ["Automation", "Sim"], hours: 60, intensity: 2, minSession: 60, moods: ["brainy"], hue: 30 },
  { id: "satisfactory", title: "Satisfactory", year: 2024, genres: ["Automation", "Sim"], hours: 70, intensity: 1, minSession: 60, moods: ["brainy", "chill"], hue: 40 },
  { id: "subnautica", title: "Subnautica", year: 2018, genres: ["Survival", "Exploration"], hours: 30, intensity: 3, minSession: 45, moods: ["story", "chill"], hue: 190 },
  { id: "minecraft", title: "Minecraft", year: 2011, genres: ["Sandbox", "Survival"], hours: 100, intensity: 1, minSession: 20, moods: ["chill"], hue: 105 },
  { id: "terraria", title: "Terraria", year: 2011, genres: ["Sandbox", "Action"], hours: 50, intensity: 2, minSession: 30, moods: ["chill", "action"], hue: 120 },
  { id: "it-takes-two", title: "It Takes Two", year: 2021, genres: ["Co-op", "Platformer"], hours: 13, intensity: 2, minSession: 40, moods: ["action", "chill"], hue: 15 },
  { id: "split-fiction", title: "Split Fiction", year: 2025, genres: ["Co-op", "Action Adventure"], hours: 14, intensity: 3, minSession: 40, moods: ["action", "story"], hue: 250 },
  { id: "resident-evil-4", title: "Resident Evil 4 (Remake)", year: 2023, genres: ["Survival Horror", "Action"], hours: 16, intensity: 4, minSession: 45, moods: ["action"], hue: 5 },
  { id: "alan-wake-2", title: "Alan Wake 2", year: 2023, genres: ["Survival Horror", "Narrative"], hours: 21, intensity: 4, minSession: 60, moods: ["story"], hue: 215 },
  { id: "death-stranding", title: "Death Stranding", year: 2019, genres: ["Action Adventure", "Open World"], hours: 40, intensity: 2, minSession: 60, moods: ["story", "chill"], hue: 200 },
  { id: "ghost-of-tsushima", title: "Ghost of Tsushima", year: 2020, genres: ["Action Adventure", "Open World"], hours: 25, intensity: 3, minSession: 45, moods: ["action", "story"], hue: 0 },
  { id: "astro-bot", title: "Astro Bot", year: 2024, genres: ["Platformer"], hours: 11, intensity: 2, minSession: 20, moods: ["chill", "action"], hue: 210 },
  { id: "metaphor", title: "Metaphor: ReFantazio", year: 2024, genres: ["JRPG", "Turn-Based"], hours: 68, intensity: 2, minSession: 60, moods: ["story"], hue: 175 },
  { id: "clair-obscur", title: "Clair Obscur: Expedition 33", year: 2025, genres: ["RPG", "Turn-Based"], hours: 30, intensity: 3, minSession: 45, moods: ["story", "challenge"], hue: 340 },
  { id: "lies-of-p", title: "Lies of P", year: 2023, genres: ["Action RPG", "Soulslike"], hours: 30, intensity: 5, minSession: 60, moods: ["challenge", "action"], hue: 35 },
  { id: "return-of-the-obra-dinn", title: "Return of the Obra Dinn", year: 2018, genres: ["Mystery", "Puzzle"], hours: 8, intensity: 1, minSession: 30, moods: ["brainy", "story"], hue: 50 },
  { id: "the-last-of-us-1", title: "The Last of Us Part I", year: 2022, genres: ["Action Adventure"], hours: 15, intensity: 4, minSession: 45, moods: ["story", "action"], hue: 90 },
  { id: "rocket-league", title: "Rocket League", year: 2015, genres: ["Sports", "Competitive"], hours: 20, intensity: 4, minSession: 10, moods: ["action"], hue: 25 },
  { id: "pentiment", title: "Pentiment", year: 2022, genres: ["Narrative", "Adventure"], hours: 16, intensity: 1, minSession: 40, moods: ["story", "brainy"], hue: 40 },
  { id: "cult-of-the-lamb", title: "Cult of the Lamb", year: 2022, genres: ["Roguelike", "Sim"], hours: 14, intensity: 3, minSession: 25, moods: ["action", "chill"], hue: 0 },
  { id: "dave-the-diver", title: "Dave the Diver", year: 2023, genres: ["Adventure", "Sim"], hours: 26, intensity: 2, minSession: 25, moods: ["chill"], hue: 195 },
  { id: "sea-of-stars", title: "Sea of Stars", year: 2023, genres: ["JRPG", "Turn-Based"], hours: 28, intensity: 2, minSession: 40, moods: ["story", "chill"], hue: 230 },
  { id: "pizza-tower", title: "Pizza Tower", year: 2023, genres: ["Platformer", "Indie"], hours: 7, intensity: 4, minSession: 20, moods: ["action", "challenge"], hue: 45 },
  { id: "cuphead", title: "Cuphead", year: 2017, genres: ["Run and Gun", "Indie"], hours: 11, intensity: 5, minSession: 20, moods: ["challenge"], hue: 35 },
  { id: "katana-zero", title: "Katana ZERO", year: 2019, genres: ["Action", "Indie"], hours: 5, intensity: 4, minSession: 20, moods: ["action", "story"], hue: 300 },
];

const byId = new Map(CATALOG.map((g) => [g.id, g]));

export function getCatalogGame(id: string): CatalogGame | undefined {
  return byId.get(id);
}

/** A starter library so reviewers never land on an empty screen. */
export const SAMPLE_LIBRARY: {
  gameId: string;
  status: "backlog" | "playing" | "finished" | "dropped";
  hoursPlayed: number;
  rating?: number;
  daysAgo: number;
}[] = [
  { gameId: "elden-ring", status: "playing", hoursPlayed: 21, daysAgo: 40 },
  { gameId: "stardew-valley", status: "backlog", hoursPlayed: 0, daysAgo: 214 },
  { gameId: "baldurs-gate-3", status: "backlog", hoursPlayed: 6, daysAgo: 300 },
  { gameId: "hades", status: "finished", hoursPlayed: 31, rating: 5, daysAgo: 400 },
  { gameId: "celeste", status: "finished", hoursPlayed: 10, rating: 5, daysAgo: 500 },
  { gameId: "witcher-3", status: "dropped", hoursPlayed: 14, rating: 3, daysAgo: 700 },
  { gameId: "persona-5", status: "dropped", hoursPlayed: 22, rating: 4, daysAgo: 600 },
  { gameId: "outer-wilds", status: "backlog", hoursPlayed: 0, daysAgo: 120 },
  { gameId: "portal-2", status: "finished", hoursPlayed: 9, rating: 5, daysAgo: 900 },
  { gameId: "hollow-knight", status: "backlog", hoursPlayed: 3, daysAgo: 365 },
  { gameId: "balatro", status: "playing", hoursPlayed: 12, daysAgo: 30 },
  { gameId: "disco-elysium", status: "backlog", hoursPlayed: 0, daysAgo: 160 },
  { gameId: "a-short-hike", status: "backlog", hoursPlayed: 0, daysAgo: 80 },
  { gameId: "red-dead-2", status: "backlog", hoursPlayed: 4, daysAgo: 450 },
  { gameId: "inside", status: "backlog", hoursPlayed: 0, daysAgo: 60 },
  { gameId: "sekiro", status: "backlog", hoursPlayed: 0, daysAgo: 200 },
];
