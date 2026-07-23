"use client";

import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";
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
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md space-y-6">
        <AuthHeader heading="Create an account" description="Enter your details to create your account" />
        <RegisterForm />
        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-primary underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
