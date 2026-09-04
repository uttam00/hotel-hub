import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import type { Role, UserStatus } from "@prisma/client";
import { getDashboardPath, isPathAccessible } from "@/lib/route-access";

/** Where a user owing a password change is pinned until they complete it. */
const SET_PASSWORD_PATH = "/auth/set-password";

/** Shown to accounts a super admin has deactivated. */
const DEACTIVATED_PATH = "/auth/deactivated";

/**
 * Auth pages that must stay reachable even for a signed-in user, so the
 * onboarding and deactivation flows can't trap someone in a redirect loop.
 */
const ALWAYS_ALLOWED_AUTH_PATHS = [
  SET_PASSWORD_PATH,
  DEACTIVATED_PATH,
  "/auth/signout",
  "/auth/error",
];

function isAlwaysAllowed(path: string) {
  return ALWAYS_ALLOWED_AUTH_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Route protection.
 *
 * Order matters: account state is checked *before* role, because a deactivated
 * or half-onboarded admin must be stopped regardless of what their role would
 * otherwise permit.
 *
 * This is the first line of defence, not the only one. It runs on navigations,
 * so it can't be the sole guard — every protected API independently calls
 * `requireActiveUser()`, which re-reads the database. Middleware exists to give
 * the user a sensible redirect; the API guards are what actually secure the data.
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as Role | undefined;
    const status = (token?.status as UserStatus | undefined) ?? "ACTIVE";
    const mustChangePassword = Boolean(token?.mustChangePassword);

    // Signed out: only the auth section is reachable, and withAuth's
    // `authorized` callback below handles the redirect for everything else.
    if (!token) return NextResponse.next();

    // Escape hatches first, so the rules below can never trap a user.
    if (isAlwaysAllowed(path)) {
      // ...except that someone who no longer owes a password change shouldn't
      // linger on the set-password screen.
      if (path === SET_PASSWORD_PATH && !mustChangePassword && status === "ACTIVE") {
        return NextResponse.redirect(new URL(getDashboardPath(role!), req.url));
      }
      if (path === DEACTIVATED_PATH && status !== "INACTIVE") {
        return NextResponse.redirect(new URL(getDashboardPath(role!), req.url));
      }
      return NextResponse.next();
    }

    // A deactivated account keeps its session but reaches nothing.
    if (status === "INACTIVE") {
      return NextResponse.redirect(new URL(DEACTIVATED_PATH, req.url));
    }

    // The mandatory password change. This is why typing /hostel-admin by hand
    // doesn't work: the check happens here, before any page renders, rather
    // than in React state that a user could sidestep.
    if (mustChangePassword || status === "PENDING") {
      return NextResponse.redirect(new URL(SET_PASSWORD_PATH, req.url));
    }

    // Already signed in and fully onboarded — no reason to sit on login/register.
    if (path.startsWith("/auth")) {
      return NextResponse.redirect(new URL(getDashboardPath(role!), req.url));
    }

    if (
      path.startsWith("/dashboard") ||
      path.startsWith("/hostel-admin") ||
      path.startsWith("/super-admin") ||
      path.startsWith("/profile")
    ) {
      if (!isPathAccessible(path, role!)) {
        return NextResponse.redirect(new URL(getDashboardPath(role!), req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // The auth section stays public; the middleware above decides what a
        // signed-in user may see there.
        if (path.startsWith("/auth")) return true;
        return !!token;
      },
    },
    pages: {
      signIn: "/auth/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/:path*",
    "/hostel-admin/:path*",
    "/super-admin/:path*",
    "/profile/:path*",
  ],
};
