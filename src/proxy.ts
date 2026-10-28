import { NextRequest, NextResponse } from "next/server";
import { decrypt, SESSION_COOKIE } from "@/lib/session";

// Proxy (formerly "middleware") runs before every matched request. It only does a cheap,
// optimistic check of the cookie to redirect early. The real security check happens in the
// Data Access Layer (src/lib/dal.ts), right next to the data.

const PROTECTED = ["/library", "/pick", "/plan", "/stats"];
const AUTH_PAGES = ["/login", "/signup"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session && PROTECTED.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (session && (AUTH_PAGES.includes(path) || path === "/")) {
    return NextResponse.redirect(new URL("/library", req.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
