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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BrandSpinner } from "@/components/ui/brand-spinner";
import { registerUserSchemaWithConfirm } from "@/lib/validation_schema";
import { useAuth } from "@/hooks/use-auth";
import { authApi } from "@/services/api";

const registerSchema = registerUserSchemaWithConfirm.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { updateUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RegisterFormValues>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value as "STUDENT" | "HOSTEL_ADMIN",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data
      registerSchema.parse(formData);

      // Send registration request
      const data = await authApi.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      if (data) {
        updateUser(data);
      }

      // Sign in the user
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Registration successful, but login failed. Please try logging in.");
        setIsLoading(false);
        router.push("/auth/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        const errorMessage =
          Object.values(fieldErrors)[0]?.[0] || "Invalid input";
        toast.error(errorMessage);
      } else if (error instanceof Error) {
        toast.error(error.message);
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
          Create an account
        </CardTitle>
        <CardDescription className="text-center">
          Enter your details to create your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="John Doe"
              required
              value={formData.name}
              onChange={handleChange}
            />
          </div>
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">I am a</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="HOSTEL_ADMIN">
                  Hostel Administrator
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <BrandSpinner size="sm" className="mr-2" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
