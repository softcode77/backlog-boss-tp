"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, startDemo } from "@/app/actions/auth";

// "use client" = this component runs in the browser too, so it can use hooks like useActionState.
// The form still submits to a Server Action; useActionState gives us its returned errors + pending flag.

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, action, pending] = useActionState(mode === "login" ? login : signup, undefined);
  const isLogin = mode === "login";

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="card w-full max-w-sm p-6">
        <Link href="/" className="font-pixel text-xs text-neon">
          Backlog Boss
        </Link>
        <h1 className="mt-4 text-xl font-semibold">{isLogin ? "Welcome back, player" : "Create your account"}</h1>

        <form action={action} className="mt-6 space-y-4">
          <div>
            <label htmlFor="username" className="text-sm text-muted">
              Gamertag
            </label>
            <input id="username" name="username" className="input mt-1" autoComplete="username" required />
            {state?.fieldErrors?.username && <p className="mt-1 text-xs text-bad">{state.fieldErrors.username[0]}</p>}
          </div>
          <div>
            <label htmlFor="password" className="text-sm text-muted">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input mt-1"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
            />
            {state?.fieldErrors?.password && <p className="mt-1 text-xs text-bad">{state.fieldErrors.password[0]}</p>}
          </div>
          {state?.error && <p className="text-sm text-bad">{state.error}</p>}
          <button className="btn-primary w-full" disabled={pending}>
            {pending ? "Loading…" : isLogin ? "Log in" : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link href={isLogin ? "/signup" : "/login"} className="text-neon-2 hover:underline">
            {isLogin ? "Create an account" : "Log in"}
          </Link>
        </p>
        <form action={startDemo} className="mt-2 text-center">
          <button className="text-xs text-muted hover:text-ink">or just try the demo →</button>
        </form>
      </div>
    </main>
  );
}
