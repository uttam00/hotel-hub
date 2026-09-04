import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { authzErrorResponse, requireRole } from "@/lib/authz";
import { INVITE_TTL_HOURS, issueInviteToken } from "@/lib/invite";
import { appUrl, sendAdminInviteEmail } from "@/lib/email";
import logger from "@/lib/logger";

/**
 * Hostel-admin accounts, managed by a super admin.
 *
 * Creation is invitation-based. The previous implementation generated a
 * password with `uuidv4().substring(0, 12)`, stored it, and emailed it to the
 * new admin in cleartext with nothing ever forcing a change — so a mailbox
 * breach handed over a working admin login indefinitely. Now no password is
 * ever created or transmitted: the account starts PENDING and the admin sets
 * their own password through a hashed, single-use, expiring link.
 */

const createAdminSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  /** Hostels to assign on creation. Optional — can be assigned later. */
  hostelIds: z.array(z.string()).optional().default([]),
  /**
   * PENDING sends an invitation; ACTIVE is only meaningful for an account that
   * already has a password, so creation always ends up PENDING in practice.
   */
  status: z.enum(["PENDING", "INACTIVE"]).optional().default("PENDING"),
});

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");

    const admins = await prisma.user.findMany({
      where: { role: "HOSTEL_ADMIN" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        mustChangePassword: true,
        invitedAt: true,
        onboardingCompletedAt: true,
        createdAt: true,
        hostels: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(admins);
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    logger.error("Failed to list admins", "ADMINS_GET", error);
    return NextResponse.json({ error: "Failed to load admins" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const superAdmin = await requireRole("SUPER_ADMIN");

    const parsed = createAdminSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { name, email, hostelIds, status } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 }
      );
    }

    // Verify every hostel exists before creating anything, so a typo can't
    // leave a half-assigned admin behind.
    if (hostelIds.length > 0) {
      const found = await prisma.hostel.count({ where: { id: { in: hostelIds } } });
      if (found !== hostelIds.length) {
        return NextResponse.json(
          { error: "One or more selected hostels no longer exist" },
          { status: 400 }
        );
      }
    }

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        role: "HOSTEL_ADMIN",
        status,
        // No password is set at all: the account cannot be signed into until
        // the invitation is redeemed.
        password: null,
        mustChangePassword: true,
        invitedAt: status === "PENDING" ? new Date() : null,
        hostels: hostelIds.length > 0 ? { connect: hostelIds.map((id) => ({ id })) } : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        hostels: { select: { id: true, name: true } },
      },
    });

    let emailSent = false;
    if (status === "PENDING") {
      const { rawToken } = await issueInviteToken(admin.id, superAdmin.id);
      const result = await sendAdminInviteEmail({
        to: admin.email!,
        name: admin.name,
        inviteUrl: appUrl(`/auth/set-password?token=${rawToken}`),
        hostelNames: admin.hostels.map((h) => h.name),
        expiresInHours: INVITE_TTL_HOURS,
      });
      emailSent = result.sent;
    }

    logger.info(`Admin ${admin.email} created by ${superAdmin.email}`, "ADMINS_POST");

    // The account exists either way; the caller is told if the email didn't go
    // out so they can resend rather than assuming the admin was notified.
    return NextResponse.json({ ...admin, emailSent }, { status: 201 });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    logger.error("Failed to create admin", "ADMINS_POST", error);
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}
