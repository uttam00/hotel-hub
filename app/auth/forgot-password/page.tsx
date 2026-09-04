"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, MailCheck } from "lucide-react";

import { AuthHeader } from "@/components/auth/auth-header";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandSpinner } from "@/components/ui/brand-spinner";
import { authApi } from "@/services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success("Reset link sent — check your email.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send reset link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      footer={
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground underline-offset-4 transition-ui hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div>
          <span className="mb-4 inline-flex size-10 items-center justify-center rounded-md border border-success-border bg-success-subtle">
            <MailCheck className="size-5 text-success" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ve sent a password reset link to{" "}
            <span className="font-medium text-foreground">{email}</span>. It may take a
            minute to arrive — check your spam folder too.
          </p>
          <Button
            variant="outline"
            onClick={() => setSent(false)}
            className="mt-5 w-full"
          >
            Use a different email
          </Button>
        </div>
      ) : (
        <>
          <AuthHeader
            heading="Reset your password"
            description="Enter your email and we'll send you a link to set a new one."
          />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <BrandSpinner size="sm" />
                  Sending…
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
