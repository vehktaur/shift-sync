import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "shift_sync_session";
const LOGIN_PATH = "/login";

const PROTECTED_PATH_PREFIXES = [
  "/",
  "/schedule",
  "/coverage",
  "/team",
  "/notifications",
  "/activity",
] as const;

const isProtectedPath = (pathname: string) =>
  PROTECTED_PATH_PREFIXES.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname.startsWith(prefix),
  );

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (pathname === LOGIN_PATH && hasSessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isProtectedPath(pathname) && !hasSessionCookie) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/schedule/:path*",
    "/coverage/:path*",
    "/team/:path*",
    "/notifications/:path*",
    "/activity/:path*",
  ],
};
