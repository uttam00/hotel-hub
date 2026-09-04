"use client";

import { Panel, PanelHeader } from "@/components/ui/panel";
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
    { id: "currentPassword", value: "Current password", autoComplete: "current-password" },
    { id: "newPassword", value: "New password", autoComplete: "new-password" },
    { id: "confirmPassword", value: "Confirm new password", autoComplete: "new-password" },
  ];

  return (
    <Panel>
      <PanelHeader
        title="Change password"
        description="You'll stay signed in on this device"
      />
      <form onSubmit={handleSubmit} className="space-y-4 p-3">
        {fieldName.map(({ id, value, autoComplete }) => (
          <div key={id} className="space-y-1.5">
            <Label htmlFor={id}>{value}</Label>
            <Input
              id={id}
              name={id}
              type="password"
              autoComplete={autoComplete}
              value={(passwordData as any)[id]}
              onChange={handleChange}
              aria-invalid={!!errors[id]}
              aria-describedby={errors[id] ? `${id}-error` : undefined}
            />
            {errors[id] && (
              <p id={`${id}-error`} className="text-sm text-danger">
                {errors[id]}
              </p>
            )}
          </div>
        ))}
        <div className="border-t border-border pt-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Changing…" : "Change password"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
