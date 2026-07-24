import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";
import { LoginForm } from "@/components/auth/login-form";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  // Redirect to appropriate dashboard if already logged in
  if (session?.user) {
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

    redirect(redirectPath);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md space-y-6">
        <AuthHeader heading="Welcome back" description="Enter your credentials to access your account" />
        <LoginForm />
        <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="text-primary underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
