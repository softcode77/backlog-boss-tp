"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, deleteSession } from "@/lib/session";
import { seedDemoExtras, seedSampleLibrary } from "@/lib/sample";

// "use server" turns every exported function in this file into a Server Action: the browser can
// call it (e.g. from a <form action={...}>), but the code only ever runs on the server.

export type AuthState = { error?: string; fieldErrors?: { username?: string[]; password?: string[] } } | undefined;

const Credentials = z.object({
  username: z
    .string()
    .trim()
    .min(3, { error: "At least 3 characters." })
    .max(20, { error: "At most 20 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, { error: "Letters, numbers and underscores only." }),
  password: z.string().min(6, { error: "At least 6 characters." }),
});

function parse(formData: FormData) {
  return Credentials.safeParse({ username: formData.get("username"), password: formData.get("password") });
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { username, password } = parsed.data;

  const taken = await db.query.users.findFirst({ where: eq(users.username, username.toLowerCase()) });
  if (taken) return { fieldErrors: { username: ["That gamertag is taken."] } };

  const id = crypto.randomUUID();
  await db.insert(users).values({
    id,
    username: username.toLowerCase(),
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date(),
  });
  await createSession({ userId: id, username: username.toLowerCase() });
  redirect("/library");
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: "Invalid gamertag or password." };
  const { username, password } = parsed.data;

  const user = await db.query.users.findFirst({ where: eq(users.username, username.toLowerCase()) });
  // Same message for "no such user" and "wrong password" so we don't leak which usernames exist.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Invalid gamertag or password." };
  }
  await createSession({ userId: user.id, username: user.username });
  redirect("/library");
}

/** One click: throwaway account with a pre-filled backlog, so reviewers can explore immediately. */
export async function startDemo() {
  const id = crypto.randomUUID();
  const username = `guest_${id.slice(0, 6)}`;
  await db.insert(users).values({
    id,
    username,
    passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
    createdAt: new Date(),
  });
  await seedSampleLibrary(id);
  await seedDemoExtras(id);
  await createSession({ userId: id, username });
  redirect("/pick");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
