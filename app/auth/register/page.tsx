"use client";

import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = session.user.role;
      let redirectPath = "/";

      switch (role) {
        case "SUPER_ADMIN":
          redirectPath = "/super-admin";
          break;
        case "HOSTEL_ADMIN":
          redirectPath = "/hostel-admin";
          break;
        case "STUDENT":
          redirectPath = "/dashboard";
          break;
      }

      router.push(redirectPath);
    }
  }, [session, status, router]);

  return (
    <AuthShell
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="rounded-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <AuthHeader
        heading="Create your account"
        description="Find a hostel, book a room, and manage your stay in one place."
      />
      <RegisterForm />
    </AuthShell>
  );
}
