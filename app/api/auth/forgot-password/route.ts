import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";
import logger from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      logger.info(`Password reset requested for non-existent email: ${email}`, "FORGOT_PASSWORD");
      return NextResponse.json({
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Build reset URL
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;

    // Try to send email via SendGrid
    try {
      const sgMail = require("@sendgrid/mail");
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      await sgMail.send({
        to: user.email!,
        from: process.env.FROM_EMAIL!,
        subject: "Password Reset Request",
        html: `
          <p>Hello ${user.name || ""},</p>
          <p>You requested a password reset for your account.</p>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <p><a href="${resetUrl}">Reset Your Password</a></p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });

      logger.info(`Password reset email sent to ${email}`, "FORGOT_PASSWORD");
    } catch (emailError) {
      logger.error("Failed to send password reset email", "FORGOT_PASSWORD", emailError);
      // In development, log the reset URL
      if (process.env.NODE_ENV === "development") {
        logger.info(`DEV: Reset URL: ${resetUrl}`, "FORGOT_PASSWORD");
      }
    }

    return NextResponse.json({
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    logger.error("Forgot password error", "FORGOT_PASSWORD", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
