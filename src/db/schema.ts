import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { STATUSES } from "../lib/status";

export { STATUSES, type Status } from "../lib/status";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

/** One row per game in a user's library. Game details live in the code catalog (src/data/catalog.ts). */
export const libraryEntries = sqliteTable(
  "library_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: text("game_id").notNull(),
    status: text("status", { enum: STATUSES }).notNull(),
    hoursPlayed: real("hours_played").notNull().default(0),
    rating: integer("rating"),
    addedAt: integer("added_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [uniqueIndex("library_user_game").on(t.userId, t.gameId)],
);

/** Every "Play this" / "Not tonight" click. The picker learns the user's taste from this history. */
export const pickFeedback = sqliteTable(
  "pick_feedback",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: text("game_id").notNull(),
    accepted: integer("accepted", { mode: "boolean" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("feedback_user").on(t.userId)],
);

/** Weekly availability + goal used by the campaign planner. One per user. */
export const plans = sqliteTable("plans", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  /** JSON array of 7 numbers: minutes available Mon..Sun. */
  weeklyMinutes: text("weekly_minutes").notNull(),
  /** ISO date (YYYY-MM-DD) the user wants to hit their goal by. */
  deadline: text("deadline").notNull(),
  /** JSON array of game ids in priority order. */
  queue: text("queue").notNull(),
});
