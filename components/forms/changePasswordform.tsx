"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { changePasswordSchema } from "@/lib/validation_schema";
import { userApi } from "@/services/api";

export default function ChangePasswordForm() {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const validated = changePasswordSchema.parse(passwordData);

      await userApi.changePassword(validated);

      toast.success("Password changed");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message;
        });
        setErrors(fieldErrors);
      } else {
        toast.error(err.message || "Error changing password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fieldName = [
    {
      id: "currentPassword",
      value: "Current Password",
    },
    {
      id: "newPassword",
      value: "New Password",
    },
    {
      id: "confirmPassword",
      value: "Confirm Password",
    },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fieldName.map(({ id, value }) => (
            <div key={id}>
              <Label htmlFor={id}>{value}</Label>
              <Input
                id={id}
                name={id}
                type="password"
                value={(passwordData as any)[id]}
                onChange={handleChange}
                className={errors[id] ? "border-red-500" : ""}
              />
              {errors[id] && (
                <p className="text-sm text-red-500">{errors[id]}</p>
              )}
            </div>
          ))}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Changing..." : "Change Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
