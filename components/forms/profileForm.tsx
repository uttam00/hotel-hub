"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Pencil, X } from "lucide-react";
import type { Value as E164Number } from "react-phone-number-input";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldList, Panel, PanelHeader } from "@/components/ui/panel";
import { useAuth } from "@/hooks/use-auth";
import { updateProfileSchema } from "@/lib/validation_schema";
import { uploadApi, userApi } from "@/services/api";
import { formatPhone, initialsFromName } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ProfileForm() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(user?.image ?? "");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    image: "",
    phoneNumber: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        image: user.image || "",
        phoneNumber: user.phoneNumber || "",
      });
      setPreviewImage(user.image || null);
    }
  }, [user]);

  useEffect(() => {
    if (!isEditing) setFormErrors({});
  }, [isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePhoneChange = (value?: E164Number) => {
    setFormData((prev) => ({ ...prev, phoneNumber: value || "" }));
    if (formErrors.phoneNumber) setFormErrors((prev) => ({ ...prev, phoneNumber: "" }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files allowed");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewImage(formData.image || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const validated = updateProfileSchema.parse(formData);

      let uploadedImage = formData.image;
      if (selectedImage) {
        const data = await uploadApi.uploadImage(selectedImage, "profile");
        uploadedImage = data.url;
      }

      await userApi.update({
        id: user?.id!,
        name: validated.name,
        phoneNumber: validated.phoneNumber,
        image: uploadedImage,
      });

      await updateUser({
        name: validated.name,
        phoneNumber: validated.phoneNumber,
        image: uploadedImage,
      });

      toast.success("Profile updated");
      setIsEditing(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) errors[err.path[0].toString()] = err.message;
        });
        setFormErrors(errors);
      }
      toast.error("Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Square avatar, left-aligned identity, values in a field list.
   *
   * The previous version centred a 128px circular photo above a centred name
   * and a centred "Edit Profile" button — a consumer mobile profile screen
   * dropped into an operations console. Everything here now sits on the same
   * left axis as every other page.
   */
  return (
    <Panel>
      <PanelHeader
        title="Your details"
        description="Shown to the hostels you stay with"
        action={
          !isEditing ? (
            <Button size="xs" variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="size-3" />
              Edit
            </Button>
          ) : undefined
        }
      />

      <div className="p-3">
        <div className="mb-4 flex items-center gap-3">
          <div className="group relative size-14 shrink-0">
            {previewImage ? (
              <Image
                key={previewImage}
                src={previewImage}
                alt=""
                fill
                className="rounded-md border border-border object-cover"
              />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-md border border-border bg-primary-subtle text-md font-semibold text-primary">
                {initialsFromName(user?.name)}
              </div>
            )}
            {isEditing && previewImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                title="Remove image"
                aria-label="Remove profile image"
                className="absolute -right-1.5 -top-1.5 rounded-sm border border-danger-border bg-card p-0.5 text-danger opacity-0 transition-ui hover:bg-danger hover:text-destructive-foreground focus-visible:opacity-100 group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-md font-semibold text-foreground">
              {user?.name || "Unnamed"}
            </p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>

          {isEditing && (
            <div className="ml-auto">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="profile-image"
              />
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => document.getElementById("profile-image")?.click()}
              >
                {previewImage ? "Change photo" : "Add photo"}
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                aria-invalid={!!formErrors.name}
                aria-describedby={formErrors.name ? "name-error" : undefined}
              />
              {formErrors.name && (
                <p id="name-error" className="text-sm text-danger">
                  {formErrors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={formData.email} disabled />
              <p className="text-xs text-muted-foreground">
                Your email is how you sign in and can&apos;t be changed here.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber">Phone</Label>
              <PhoneInput
                id="phoneNumber"
                international
                countryCallingCodeEditable={false}
                defaultCountry="IN"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                className={cn(
                  "flex h-9 w-full rounded-sm border bg-card px-2.5 py-1.5 text-sm transition-ui",
                  "[&_input]:bg-transparent [&_input]:outline-none",
                  formErrors.phoneNumber ? "border-danger" : "border-input"
                )}
              />
              {formErrors.phoneNumber && (
                <p className="text-sm text-danger">{formErrors.phoneNumber}</p>
              )}
            </div>

            <div className="flex gap-2 border-t border-border pt-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving…" : "Save changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <FieldList className="border-t border-border">
            <Field label="Full name">{user?.name || "—"}</Field>
            <Field label="Email">{user?.email || "—"}</Field>
            <Field label="Phone">
              {user?.phoneNumber ? (
                formatPhone(user.phoneNumber)
              ) : (
                <span className="text-muted-foreground">Not added yet</span>
              )}
            </Field>
          </FieldList>
        )}
      </div>
    </Panel>
  );
}
