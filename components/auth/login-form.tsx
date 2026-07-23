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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
          name: userData.name,
          image: userData.image,
          phoneNumber: userData.phoneNumber,
        });

        // Redirect based on role
        if (userData.role === "STUDENT") {
          router.push("/dashboard");
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">
          Log in to your account
        </CardTitle>
        <CardDescription className="text-center">
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <BrandSpinner size="sm" className="mr-2" />
                Logging in...
              </>
            ) : (
              "Log in"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
