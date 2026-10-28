// Shared by the DB schema (server) and the UI (browser), so it must not import any DB code.
export const STATUSES = ["backlog", "playing", "finished", "dropped"] as const;
export type Status = (typeof STATUSES)[number];
