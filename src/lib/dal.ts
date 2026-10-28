import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { decrypt, SESSION_COOKIE } from "./session";

// Data Access Layer: the ONE place that decides "who is the current user?".
// Every page and server action that touches user data calls requireUser() first.

export type CurrentUser = { id: string; username: string };

/** Returns the logged-in user, or null. Memoized per request with React's cache(). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await decrypt(token);
  if (!session) return null;

  // The cookie is valid, but make sure the account still exists.
  const row = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    columns: { id: true, username: true },
  });
  return row ?? null;
});

/**
 * Like getCurrentUser, but sends anonymous visitors away. We go via /logout (which clears the
 * cookie, then lands on /login) so a stale cookie for a deleted account can't cause a redirect loop
 * with the proxy.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  return user;
}
