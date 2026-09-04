import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { Role } from "@prisma/client";

export class AuthzError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Throws AuthzError(401) if not logged in; otherwise returns the current user. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthzError(401, "Unauthorized");
  return user;
}

/**
 * The account state a request needs before it may do anything meaningful.
 *
 * Read fresh from the database on every call, deliberately: the session JWT is
 * minted at login and lives for days, so a super admin deactivating an account
 * or an admin still owing a password change would otherwise keep working until
 * their token happened to expire. The database is the source of truth.
 */
export async function requireActiveUser() {
  const sessionUser = await requireUser();

  const account = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      role: true,
      status: true,
      mustChangePassword: true,
      email: true,
      name: true,
    },
  });

  // Deleted out from under a live session.
  if (!account) throw new AuthzError(401, "Unauthorized");

  if (account.status === "INACTIVE") {
    throw new AuthzError(403, "This account has been deactivated.");
  }
  if (account.status === "PENDING") {
    throw new AuthzError(403, "Finish setting up your account before continuing.");
  }
  if (account.mustChangePassword) {
    throw new AuthzError(403, "You must set a new password before continuing.");
  }

  return account;
}

/**
 * Throws AuthzError(401/403) unless the current user has one of the given roles.
 *
 * Also enforces account state, so a deactivated or half-onboarded admin cannot
 * call an API even though their role is nominally correct.
 */
export async function requireRole(...roles: Role[]) {
  const user = await requireActiveUser();
  if (!roles.includes(user.role)) throw new AuthzError(403, "Forbidden");
  return user;
}

/** Throws AuthzError(403) unless userId administers hostelId (SUPER_ADMIN always passes). */
export async function requireHostelAccess(
  userId: string,
  role: Role,
  hostelId: string
) {
  if (role === "SUPER_ADMIN") return;
  const hostel = await prisma.hostel.findFirst({
    where: { id: hostelId, admins: { some: { id: userId } } },
    select: { id: true },
  });
  if (!hostel) throw new AuthzError(403, "Forbidden: not your hostel");
}

/**
 * The common hostel-admin guard: correct role, healthy account, and this
 * specific hostel actually assigned to them.
 *
 * Collapses the requireRole + requireHostelAccess pair that every hostel-admin
 * route was repeating, so a new route can't accidentally do only half of it.
 */
export async function requireHostelAdmin(hostelId: string) {
  const user = await requireRole("HOSTEL_ADMIN", "SUPER_ADMIN");
  await requireHostelAccess(user.id, user.role, hostelId);
  return user;
}

/** Converts an AuthzError into a JSON response; returns null for anything else. */
export function authzErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof AuthzError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}
