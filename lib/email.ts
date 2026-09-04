import sgMail from "@sendgrid/mail";
import logger from "@/lib/logger";

/**
 * Outbound email.
 *
 * Configuration is read lazily and never throws at import time. The previous
 * implementation ran `throw new Error("Missing required environment
 * variables")` at module scope, so a deployment without SendGrid credentials
 * took down the whole admin-management route the moment it was imported —
 * including its GET handler, which doesn't send email at all.
 *
 * Now a missing key degrades: the caller still succeeds, the failure is logged,
 * and in development the link is printed so local flows remain testable
 * without a mail provider.
 */

const FROM_EMAIL = process.env.FROM_EMAIL;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

export function isEmailConfigured(): boolean {
  return Boolean(SENDGRID_API_KEY && FROM_EMAIL);
}

let apiKeyLoaded = false;

export interface SendResult {
  sent: boolean;
  /** Present when the message could not be sent, for the caller to surface. */
  reason?: string;
}

async function send(options: {
  to: string;
  subject: string;
  html: string;
  /** Logged (not sent) when email is unconfigured, so dev flows still work. */
  devFallbackUrl?: string;
  context: string;
}): Promise<SendResult> {
  const { to, subject, html, devFallbackUrl, context } = options;

  if (!isEmailConfigured()) {
    logger.error(`Email not configured; skipped "${subject}"`, context);
    if (process.env.NODE_ENV !== "production" && devFallbackUrl) {
      logger.info(`DEV link for ${to}: ${devFallbackUrl}`, context);
    }
    return { sent: false, reason: "Email is not configured on this server." };
  }

  try {
    if (!apiKeyLoaded) {
      sgMail.setApiKey(SENDGRID_API_KEY!);
      apiKeyLoaded = true;
    }
    await sgMail.send({ to, from: FROM_EMAIL!, subject, html });
    logger.info(`Sent "${subject}" to ${to}`, context);
    return { sent: true };
  } catch (error) {
    logger.error(`Failed to send "${subject}" to ${to}`, context, error);
    if (process.env.NODE_ENV !== "production" && devFallbackUrl) {
      logger.info(`DEV link for ${to}: ${devFallbackUrl}`, context);
    }
    return { sent: false, reason: "Email delivery failed." };
  }
}

export function appUrl(path: string): string {
  const base =
    process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

/**
 * Shared HTML shell.
 *
 * Deliberately table-free, inline-styled and narrow: email clients strip most
 * CSS, so this leans on what Outlook and Gmail actually honour. Colours mirror
 * the product's ink-indigo brand rather than defaulting to link-blue.
 */
function layout(options: {
  heading: string;
  intro: string;
  ctaLabel?: string;
  ctaUrl?: string;
  outro?: string;
  footnote?: string;
}): string {
  const { heading, intro, ctaLabel, ctaUrl, outro, footnote } = options;

  return `
<div style="margin:0;padding:24px;background:#f5f4f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e0dc;border-radius:6px;overflow:hidden;">
    <div style="padding:16px 24px;border-bottom:1px solid #e2e0dc;">
      <span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;background:#1e3a8a;color:#ffffff;border-radius:5px;font-size:13px;font-weight:700;vertical-align:middle;">H</span>
      <span style="margin-left:8px;font-size:15px;font-weight:600;color:#1c2128;vertical-align:middle;">HostelHub</span>
    </div>

    <div style="padding:24px;">
      <h1 style="margin:0 0 12px;font-size:19px;line-height:1.3;font-weight:600;color:#1c2128;">${heading}</h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#4a5058;">${intro}</p>

      ${
        ctaLabel && ctaUrl
          ? `<p style="margin:0 0 16px;">
               <a href="${ctaUrl}" style="display:inline-block;padding:10px 18px;background:#1e3a8a;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;border-radius:4px;">${ctaLabel}</a>
             </p>
             <p style="margin:0 0 16px;font-size:12px;line-height:1.6;color:#6b7280;">
               If the button doesn't work, paste this into your browser:<br>
               <span style="color:#1e3a8a;word-break:break-all;">${ctaUrl}</span>
             </p>`
          : ""
      }

      ${outro ? `<p style="margin:0;font-size:14px;line-height:1.6;color:#4a5058;">${outro}</p>` : ""}
    </div>

    ${
      footnote
        ? `<div style="padding:14px 24px;border-top:1px solid #e2e0dc;background:#faf9f7;">
             <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;">${footnote}</p>
           </div>`
        : ""
    }
  </div>
</div>`.trim();
}

/** Invitation for an admin account created by a super admin. */
export function sendAdminInviteEmail(options: {
  to: string;
  name: string | null;
  inviteUrl: string;
  hostelNames: string[];
  expiresInHours: number;
}): Promise<SendResult> {
  const { to, name, inviteUrl, hostelNames, expiresInHours } = options;

  const assignment =
    hostelNames.length > 0
      ? ` You'll be managing <strong>${hostelNames.join(", ")}</strong>.`
      : "";

  return send({
    to,
    subject: "You've been invited to manage a hostel on HostelHub",
    context: "ADMIN_INVITE",
    devFallbackUrl: inviteUrl,
    html: layout({
      heading: `Welcome${name ? `, ${name.split(" ")[0]}` : ""}`,
      intro: `An administrator has set up a HostelHub account for you.${assignment} Choose a password to activate it and you'll go straight to your dashboard.`,
      ctaLabel: "Set your password",
      ctaUrl: inviteUrl,
      outro: "Once your password is set, sign in with your email address any time.",
      footnote: `This link works once and expires in ${expiresInHours} hours. If you weren't expecting this invitation, you can safely ignore it — no account will be activated.`,
    }),
  });
}

/** Password reset for an existing account. */
export function sendPasswordResetEmail(options: {
  to: string;
  name: string | null;
  resetUrl: string;
}): Promise<SendResult> {
  const { to, name, resetUrl } = options;

  return send({
    to,
    subject: "Reset your HostelHub password",
    context: "FORGOT_PASSWORD",
    devFallbackUrl: resetUrl,
    html: layout({
      heading: "Reset your password",
      intro: `Hello${name ? ` ${name.split(" ")[0]}` : ""}, we received a request to reset the password on your HostelHub account.`,
      ctaLabel: "Choose a new password",
      ctaUrl: resetUrl,
      footnote:
        "This link expires in 1 hour and can only be used once. If you didn't request a reset, ignore this email — your password will stay as it is.",
    }),
  });
}
