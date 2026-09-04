"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, LinkIcon } from "lucide-react";

import { AuthHeader } from "@/components/auth/auth-header";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandSpinner } from "@/components/ui/brand-spinner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { authApi } from "@/services/api";

const backToLogin = (
  <Link
    href="/auth/login"
    className="inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground underline-offset-4 transition-ui hover:text-foreground hover:underline"
  >
    <ArrowLeft className="size-3.5" />
    Back to sign in
  </Link>
);

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <AuthShell footer={backToLogin}>
        <span className="mb-4 inline-flex size-10 items-center justify-center rounded-md border border-warning-border bg-warning-subtle">
          <LinkIcon className="size-5 text-warning" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">This link has expired</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Password reset links are single-use and time-limited. Request a fresh one and
          it&apos;ll arrive in a moment.
        </p>
        <Button asChild size="lg" className="mt-5 w-full">
          <Link href="/auth/forgot-password">Request a new link</Link>
        </Button>
      </AuthShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      setSuccess(true);
      toast.success("Password changed successfully");
      setTimeout(() => router.push("/auth/login"), 3000);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell footer={backToLogin}>
        <span className="mb-4 inline-flex size-10 items-center justify-center rounded-md border border-success-border bg-success-subtle">
          <CheckCircle2 className="size-5 text-success" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Password changed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You can now sign in with your new password. Taking you there…
        </p>
        <Button asChild size="lg" className="mt-5 w-full">
          <Link href="/auth/login">Sign in now</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell footer={backToLogin}>
      <AuthHeader
        heading="Set a new password"
        description="Choose something you haven't used before."
      />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
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
            required
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <BrandSpinner size="sm" />
              Saving…
            </>
          ) : (
            "Change password"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Loading…" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
