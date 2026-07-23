import prisma from "@/lib/prisma";
import { AuthzError } from "@/lib/authz";

export type HostelAccessLevel = "FULL" | "LIMITED";

/**
 * FULL when the hostel has an ACTIVE, unexpired subscription; LIMITED
 * otherwise (never subscribed, expired, or cancelled). Existing data always
 * stays visible — this only gates the mutations checked via requireFullAccess.
 */
export async function getHostelAccessLevel(hostelId: string): Promise<HostelAccessLevel> {
  const subscription = await prisma.subscription.findUnique({ where: { hostelId } });
  if (!subscription) return "LIMITED";
  const isActive = subscription.status === "ACTIVE" && subscription.endDate > new Date();
  return isActive ? "FULL" : "LIMITED";
}

/** Throws a 402 unless the hostel's subscription is currently active. */
export async function requireFullAccess(hostelId: string) {
  const level = await getHostelAccessLevel(hostelId);
  if (level !== "FULL") {
    throw new AuthzError(
      402,
      "This hostel's subscription isn't active. Renew to continue."
    );
  }
}
