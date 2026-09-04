import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { consumeInviteToken, lookupInviteToken } from "@/lib/invite";
import logger from "@/lib/logger";

/**
 * Completes onboarding by setting a password.
 *
 * Serves two entry points that end in the same state:
 *
 *  1. An invited admin arriving from an email link, identified by a single-use
 *     token. They are not signed in yet.
 *  2. A signed-in user the system is forcing to change their password — for
 *     instance an account a super admin reset.
 *
 * Which path applies is decided *here*, from the token or the session. The
 * client never states who it is or what it is allowed to do.
 */

const bodySchema = z.object({
  token: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const FAILURE_MESSAGE: Record<string, string> = {
  invalid: "This invitation link isn't valid.",
  expired: "This invitation link has expired.",
  used: "This invitation link has already been used.",
};

/** Validates a token so the page can explain *why* a bad link failed. */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ valid: false, reason: "invalid" }, { status: 400 });
  }

  const result = await lookupInviteToken(token);
  if (!result.ok) {
    return NextResponse.json(
      { valid: false, reason: result.reason, message: FAILURE_MESSAGE[result.reason] },
      { status: 400 }
    );
  }

  // Only the display name and email — never anything that would let the holder
  // of a link enumerate the rest of the account.
  return NextResponse.json({
    valid: true,
    email: result.user.email,
    name: result.user.name,
  });
}

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;
    const hashed = await hash(password, 12);

    // ---- Path 1: invitation token ----------------------------------------
    if (token) {
      const result = await lookupInviteToken(token);
      if (!result.ok) {
        return NextResponse.json(
          { error: FAILURE_MESSAGE[result.reason] },
          { status: 400 }
        );
      }

      // Consume first. If two requests race with the same link, exactly one
      // wins the compare-and-set and the other is rejected — so a replayed
      // submit can't re-activate an account that was later deactivated.
      const consumed = await consumeInviteToken(result.tokenId);
      if (!consumed) {
        return NextResponse.json({ error: FAILURE_MESSAGE.used }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: result.user.id },
        data: {
          password: hashed,
          status: "ACTIVE",
          mustChangePassword: false,
          isVerified: true,
          emailVerified: new Date(),
          onboardingCompletedAt: new Date(),
          // Any outstanding reset request is void now that the password is set.
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      logger.info(`Invite accepted for ${result.user.email}`, "SET_PASSWORD");
      return NextResponse.json({ success: true, email: result.user.email });
    }

    // ---- Path 2: signed-in forced change ---------------------------------
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, email: true, status: true, mustChangePassword: true },
    });
    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (account.status === "INACTIVE") {
      return NextResponse.json(
        { error: "This account has been deactivated." },
        { status: 403 }
      );
    }

    // This endpoint exists only to discharge a *required* change. Voluntary
    // changes go through /api/change-password, which verifies the current
    // password — without this guard, anyone with a live session could set a
    // new password without proving they knew the old one.
    if (!account.mustChangePassword && account.status !== "PENDING") {
      return NextResponse.json(
        { error: "No password change is required for this account." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: account.id },
      data: {
        password: hashed,
        status: "ACTIVE",
        mustChangePassword: false,
        onboardingCompletedAt: new Date(),
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    logger.info(`Forced password change completed for ${account.email}`, "SET_PASSWORD");
    return NextResponse.json({ success: true, email: account.email });
  } catch (error) {
    logger.error("Set password failed", "SET_PASSWORD", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
