import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { authzErrorResponse, requireRole } from "@/lib/authz";
import { INVITE_TTL_HOURS, issueInviteToken } from "@/lib/invite";
import { appUrl, sendAdminInviteEmail } from "@/lib/email";
import logger from "@/lib/logger";

const patchSchema = z.object({
  /** ACTIVE / INACTIVE toggle. PENDING is only reachable via invitation. */
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  /** Sends a fresh invitation, superseding any outstanding link. */
  resendInvite: z.boolean().optional(),
});

/**
 * Updates an admin's account state, or re-issues their invitation.
 *
 * Deactivation is the reversible alternative to deletion: it revokes access
 * immediately — `requireActiveUser()` re-reads status on every API call — while
 * keeping the account's bookings, payments and audit trail intact.
 */
export async function PATCH(
  req: Request,
  { params: __params }: { params: Promise<{ adminId: string }> }
) {
  const params = await __params;
  try {
    const superAdmin = await requireRole("SUPER_ADMIN");

    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { status, resendInvite } = parsed.data;

    const admin = await prisma.user.findUnique({
      where: { id: params.adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        hostels: { select: { name: true } },
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }
    if (admin.role !== "HOSTEL_ADMIN") {
      return NextResponse.json(
        { error: "That account is not a hostel admin" },
        { status: 400 }
      );
    }

    if (status) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { status },
      });

      if (status === "INACTIVE") {
        // Kill any live invitation so a deactivated account can't be brought
        // back by someone still holding the emailed link.
        await prisma.inviteToken.deleteMany({
          where: { userId: admin.id, usedAt: null },
        });
      }

      logger.info(
        `Admin ${admin.email} set to ${status} by ${superAdmin.email}`,
        "ADMIN_PATCH"
      );
    }

    let emailSent: boolean | undefined;
    if (resendInvite) {
      const { rawToken } = await issueInviteToken(admin.id, superAdmin.id);
      await prisma.user.update({
        where: { id: admin.id },
        data: { status: "PENDING", mustChangePassword: true, invitedAt: new Date() },
      });

      const result = await sendAdminInviteEmail({
        to: admin.email!,
        name: admin.name,
        inviteUrl: appUrl(`/auth/set-password?token=${rawToken}`),
        hostelNames: admin.hostels.map((h) => h.name),
        expiresInHours: INVITE_TTL_HOURS,
      });
      emailSent = result.sent;

      logger.info(`Invite resent to ${admin.email} by ${superAdmin.email}`, "ADMIN_PATCH");
    }

    return NextResponse.json({ success: true, emailSent });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    logger.error("Failed to update admin", "ADMIN_PATCH", error);
    return NextResponse.json({ error: "Failed to update admin" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params: __params }: { params: Promise<{ adminId: string }> }
) {
  const params = await __params;
  try {
    const superAdmin = await requireRole("SUPER_ADMIN");

    const admin = await prisma.user.findUnique({
      where: { id: params.adminId },
      select: { id: true, email: true, role: true, _count: { select: { bookings: true } } },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }
    if (admin.role !== "HOSTEL_ADMIN" && admin.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "User is not an admin" }, { status: 400 });
    }
    // A super admin removing themselves would lock the platform's last holder
    // of full access out of it.
    if (admin.id === superAdmin.id) {
      return NextResponse.json(
        { error: "You can't delete your own account" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id: admin.id } });

    logger.info(`Admin ${admin.email} deleted by ${superAdmin.email}`, "ADMIN_DELETE");
    return NextResponse.json({ message: "Admin deleted successfully" });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    logger.error("Failed to delete admin", "ADMIN_DELETE", error);
    return NextResponse.json({ error: "Failed to delete admin" }, { status: 500 });
  }
}
