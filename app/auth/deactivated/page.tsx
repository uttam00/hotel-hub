"use client";

import { signOut } from "next-auth/react";
import { Ban } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

/**
 * Where a deactivated account lands.
 *
 * The session isn't destroyed on their behalf — signing out is offered rather
 * than forced, so the page can explain what happened instead of bouncing them
 * to a login screen with no reason given. Nothing here reads data; every API
 * they might call rejects them independently via `requireActiveUser()`.
 */
export default function DeactivatedPage() {
  return (
    <AuthShell>
      <span className="mb-4 inline-flex size-10 items-center justify-center rounded-md border border-danger-border bg-danger-subtle">
        <Ban className="size-5 text-danger" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Account deactivated</h1>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        Your HostelHub account has been deactivated, so it can no longer access hostel
        management. Your data hasn&apos;t been deleted.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        If you think this is a mistake, contact the administrator who set up your
        account, or email{" "}
        <a
          href="mailto:support@hostelhub.com"
          className="rounded-sm font-medium text-primary underline underline-offset-4"
        >
          support@hostelhub.com
        </a>
        .
      </p>

      <Button
        variant="outline"
        size="lg"
        className="mt-5 w-full"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Sign out
      </Button>
    </AuthShell>
  );
}
