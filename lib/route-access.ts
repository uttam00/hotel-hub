import type { Role } from "@prisma/client";

// Single source of truth for "which role(s) can reach which top-level
// section of the app." Consumed by middleware.ts (the actual security
// check) and by every place that needs to know a role's dashboard path
// (user-account-nav.tsx, AdminNavigation.tsx) so those can't drift out of
// sync with what middleware actually enforces. To add a new protected
// section, add one entry here — nothing else needs to change.
//
// "public"   — anyone, signed in or not
// "auth"     — any signed-in user, regardless of role
// Role[]     — only these roles
export type RouteAccess = "public" | "auth" | Role[];

export interface RouteDefinition {
  path: string;
  access: RouteAccess;
}

export const ROUTES: RouteDefinition[] = [
  { path: "/hostel-admin", access: ["HOSTEL_ADMIN"] },
  { path: "/super-admin", access: ["SUPER_ADMIN"] },
  { path: "/dashboard", access: ["STUDENT"] },
  { path: "/profile", access: "auth" },
];

const DASHBOARD_PATH: Record<Role, string> = {
  SUPER_ADMIN: "/super-admin",
  HOSTEL_ADMIN: "/hostel-admin",
  STUDENT: "/dashboard",
};

/** The base path of the section a role lands on after login. */
export function getDashboardPath(role: Role): string {
  return DASHBOARD_PATH[role] ?? "/";
}

/** Whether `path` is reachable by a signed-in user with the given role. */
export function isPathAccessible(path: string, role: Role): boolean {
  const route = ROUTES.find((r) => path.startsWith(r.path));
  if (!route) return true; // unlisted paths aren't role-gated here
  if (route.access === "public" || route.access === "auth") return true;
  return route.access.includes(role);
}

/** Routes reachable by any signed-in user regardless of role. */
export function isSharedAuthRoute(path: string): boolean {
  return ROUTES.some((r) => r.access === "auth" && path.startsWith(r.path));
}
