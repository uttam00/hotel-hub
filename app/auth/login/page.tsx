import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthShell } from "@/components/auth/auth-shell";
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
        redirectPath = "/";
        break;
    }

    redirect(redirectPath);
  }

  return (
    <AuthShell
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="rounded-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <AuthHeader
        heading="Welcome back"
        description="Sign in to manage your stay or your hostel."
      />
      <LoginForm />
    </AuthShell>
  );
}
