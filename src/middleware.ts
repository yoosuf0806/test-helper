import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Gate the whole app behind a single-user password. Unauthenticated requests
// are redirected to /login (pages) or rejected with 401 (API).
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const authed = await verifySessionToken(token);
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === "/login";

  if (authed) {
    // Already logged in: keep them out of the login page.
    if (isLoginPage) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Not authenticated: let the login page render.
  if (isLoginPage) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  if (pathname !== "/") {
    loginUrl.searchParams.set("from", pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run on everything except Next internals, static assets and the login API
  // (which must be reachable while logged out).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth/login).*)"],
};
