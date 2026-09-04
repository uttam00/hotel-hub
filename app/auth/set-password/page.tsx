"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";

import { AuthHeader } from "@/components/auth/auth-header";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandSpinner } from "@/components/ui/brand-spinner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getDashboardPath } from "@/lib/route-access";

/**
 * The onboarding gate.
 *
 * Two ways in, one outcome — an active account with a password the user chose:
 *
 *  - `?token=…` from an invitation email, for someone not yet signed in.
 *  - No token, for a signed-in account the system is forcing to change.
 *
 * Middleware pins affected users here, so this page is deliberately a dead end:
 * there is no navigation away from it until the password is actually set.
 */
function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus, update } = useSession();
  const token = searchParams.get("token");

  const [checking, setChecking] = useState(Boolean(token));
  const [linkError, setLinkError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);
  const [inviteName, setInviteName] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Validate the invitation before showing a form the user can't submit.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    fetch(`/api/auth/set-password?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (data.valid) {
          setInviteEmail(data.email);
          setInviteName(data.name);
        } else {
          setLinkError(data.message ?? "This invitation link isn't valid.");
        }
      })
      .catch(() => {
        if (!cancelled) setLinkError("We couldn't check this link. Try again shortly.");
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit = password.length >= 8 && password === confirmPassword && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token ?? undefined, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        // A link that expired between page load and submit lands here.
        if (token) setLinkError(data.error ?? "This invitation link isn't valid.");
        else toast.error(data.error ?? "Couldn't set your password");
        return;
      }

      toast.success("Password set");

      if (token) {
        // Sign the newly-activated account in so the invitation ends on the
        // dashboard rather than at another login prompt.
        const result = await signIn("credentials", {
          email: data.email,
          password,
          redirect: false,
        });
        if (result?.error) {
          router.push("/auth/login");
          return;
        }
        router.push("/hostel-admin");
        router.refresh();
        return;
      }

      // Refresh the JWT immediately so middleware stops pinning this user here.
      await update();
      router.push(session?.user?.role ? getDashboardPath(session.user.role) : "/");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking || (!token && sessionStatus === "loading")) {
    return <LoadingSpinner fullPage message="Checking your link…" />;
  }

  // ---- Bad invitation link ------------------------------------------------
  if (linkError) {
    return (
      <AuthShell
        footer={
          <Link
            href="/auth/login"
            className="rounded-sm text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Back to sign in
          </Link>
        }
      >
        <span className="mb-4 inline-flex size-10 items-center justify-center rounded-md border border-warning-border bg-warning-subtle">
          <AlertTriangle className="size-5 text-warning" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Link no longer valid</h1>
        <p className="mt-1 text-sm text-muted-foreground">{linkError}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          Ask whoever invited you to send a fresh invitation — links are single-use and
          expire after 48 hours.
        </p>
        <Button asChild size="lg" className="mt-5 w-full">
          <Link href="/auth/login">Go to sign in</Link>
        </Button>
      </AuthShell>
    );
  }

  const greetingName = inviteName ?? session?.user?.name ?? null;
  const shownEmail = inviteEmail ?? session?.user?.email ?? null;

  return (
    <AuthShell>
      <AuthHeader
        heading={token ? "Choose your password" : "Set a new password"}
        description={
          token
            ? "Your account is ready — pick a password to activate it."
            : "Your administrator requires a new password before you continue."
        }
      />

      {shownEmail && (
        <Alert className="mb-4">
          <ShieldCheck />
          <AlertDescription>
            {greetingName ? `${greetingName} · ` : ""}
            <span className="font-medium text-foreground">{shownEmail}</span>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            autoFocus
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={tooShort}
            required
          />
          {tooShort && (
            <p className="text-sm text-danger">Use at least 8 characters.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={mismatch}
            required
          />
          {mismatch && <p className="text-sm text-danger">Passwords don&apos;t match.</p>}
          {!mismatch && confirmPassword.length > 0 && password.length >= 8 && (
            <p className="flex items-center gap-1 text-sm text-success">
              <CheckCircle2 className="size-3.5" />
              Passwords match
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
          {submitting ? (
            <>
              <BrandSpinner size="sm" />
              Setting password…
            </>
          ) : token ? (
            "Activate my account"
          ) : (
            "Set password and continue"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Loading…" />}>
      <SetPasswordContent />
    </Suspense>
  );
}
