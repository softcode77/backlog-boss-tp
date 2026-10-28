// Read the clock once per request on the server and pass it down as a prop, so server and
// browser render with the same "now" (avoids hydration mismatches).
export const DAY_MS = 86_400_000;

export function requestNow(): number {
  return Date.now();
}

export function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
