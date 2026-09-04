import { createHash, randomBytes } from "crypto";

import prisma from "@/lib/prisma";

/**
 * Invitation / onboarding tokens.
 *
 * The raw token is generated once, put in the emailed link, and never stored.
 * Only its SHA-256 hash goes to the database, so read access to InviteToken
 * yields nothing that can be redeemed. Redemption is single-use (`usedAt`) and
 * time-bounded (`expiresAt`).
 *
 * SHA-256 rather than bcrypt is the right choice here: the token is 32 bytes of
 * CSPRNG output, so there is no low-entropy secret to slow an attacker down —
 * and the lookup has to be an indexed exact match, which a per-row salt would
 * make impossible.
 */

export const INVITE_TTL_HOURS = 48;

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Issues a fresh invite for a user, invalidating any outstanding ones.
 *
 * Superseding previous tokens means "resend invitation" can't leave several
 * live links for the same account.
 */
export async function issueInviteToken(
  userId: string,
  createdBy?: string
): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.inviteToken.deleteMany({ where: { userId, usedAt: null } }),
    prisma.inviteToken.create({
      data: { tokenHash: hashToken(rawToken), userId, expiresAt, createdBy },
    }),
  ]);

  return { rawToken, expiresAt };
}

export type InviteFailure = "invalid" | "expired" | "used";

export type InviteLookup =
  | { ok: true; tokenId: string; user: { id: string; email: string | null; name: string | null } }
  | { ok: false; reason: InviteFailure };

/**
 * Resolves a raw token to its user without consuming it — for rendering the
 * set-password page, where we need to tell the difference between "expired",
 * "already used" and "never existed" so the page can say something useful.
 */
export async function lookupInviteToken(rawToken: string): Promise<InviteLookup> {
  if (!rawToken) return { ok: false, reason: "invalid" };

  const record = await prisma.inviteToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!record) return { ok: false, reason: "invalid" };
  if (record.usedAt) return { ok: false, reason: "used" };
  if (record.expiresAt < new Date()) return { ok: false, reason: "expired" };

  return { ok: true, tokenId: record.id, user: record.user };
}

/**
 * Marks a token consumed, but only if it is still unused.
 *
 * The `usedAt: null` filter makes this a compare-and-set: two requests racing
 * with the same link produce one update and one miss, so the second caller is
 * told the link is spent rather than both succeeding.
 */
export async function consumeInviteToken(tokenId: string): Promise<boolean> {
  const result = await prisma.inviteToken.updateMany({
    where: { id: tokenId, usedAt: null },
    data: { usedAt: new Date() },
  });
  return result.count === 1;
}
