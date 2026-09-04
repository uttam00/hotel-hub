"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandSpinner } from "@/components/ui/brand-spinner";
import { setUserCookie } from "@/lib/cookies";
import Link from "next/link";
import { loginSchema } from "@/lib/validation_schema";
import { authApi } from "@/services/api";

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LoginFormValues>({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data
      loginSchema.parse(formData);

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        // NextAuth wraps the thrown error message in result.error
        const errorMsg = result.error === "CredentialsSignin"
          ? "Invalid email or password"
          : result.error;
        toast.error(errorMsg);
        setIsLoading(false);
        return;
      }

      // Fetch user data after successful login
      const userData = await authApi.getCurrentUser();

      if (userData) {
        // Store user information in cookies
        setUserCookie({
          id: userData.id,
          email: userData.email,
          role: userData.role,
          name: userData.name ?? undefined,
          image: userData.image ?? undefined,
          phoneNumber: userData.phoneNumber ?? undefined,
        });

        // Redirect based on role — students land on the public home page,
        // not their dashboard, and can navigate there themselves.
        if (userData.role === "STUDENT") {
          router.push("/");
        } else if (userData.role === "SUPER_ADMIN") {
          router.push("/super-admin");
        } else if (userData.role === "HOSTEL_ADMIN") {
          router.push("/hostel-admin");
        }
        router.refresh();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        const errorMessage =
          Object.values(fieldErrors)[0]?.[0] || "Invalid input";
        toast.error(errorMessage);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
      setIsLoading(false);
    }
  };

  // The heading and description come from <AuthHeader> on the page, so the
  // form renders bare rather than repeating them inside a card.
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/auth/forgot-password"
            className="rounded-sm text-sm text-muted-foreground underline-offset-4 transition-ui hover:text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={formData.password}
          onChange={handleChange}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <BrandSpinner size="sm" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
