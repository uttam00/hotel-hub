import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireUser, authzErrorResponse } from "@/lib/authz";
import { changePasswordSchema } from "@/lib/validation_schema";
import logger from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const body = await req.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, password: true },
    });

    if (!dbUser?.password) {
      return NextResponse.json(
        { error: "This account signed in with Google and has no password to change." },
        { status: 400 }
      );
    }

    const isCurrentValid = await compare(currentPassword, dbUser.password);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await prisma.notification.create({
      data: {
        title: "Password Changed",
        message: "Your password has been changed successfully.",
        type: "GENERAL",
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.flatten() },
        { status: 400 }
      );
    }

    logger.error("Change password error", "CHANGE_PASSWORD", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
