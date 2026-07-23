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

/** Throws AuthzError(401/403) unless the current user has one of the given roles. */
export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
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

/** Converts an AuthzError into a JSON response; returns null for anything else. */
export function authzErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof AuthzError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}
