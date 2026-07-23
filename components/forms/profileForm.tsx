"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { updateProfileSchema } from "@/lib/validation_schema";
import { uploadApi, userApi } from "@/services/api";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Value as E164Number } from "react-phone-number-input";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { toast } from "sonner";
import { z } from "zod";

export default function ProfileForm() {
  const { user, updateUser } = useAuth();
  console.log("User in ProfileForm:", user);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(
    user?.image ?? ""
  );
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
    if (formErrors.phoneNumber)
      setFormErrors((prev) => ({ ...prev, phoneNumber: "" }));
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
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
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

      // Upload image to Cloudinary if there's a new image
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="relative w-32 h-32 mb-4 group">
            {previewImage ? (
              <Image
                key={previewImage}
                src={previewImage}
                alt="Profile"
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-2xl text-gray-500">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {isEditing && previewImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {isEditing && (
            <div className="text-center">
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
                onClick={() =>
                  document.getElementById("profile-image")?.click()
                }
                className="w-full"
              >
                {previewImage ? "Change Profile Image" : "Add Profile Image"}
              </Button>
            </div>
          )}

          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
              {user?.name}
            </h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-sm text-muted-foreground">
              {user?.phoneNumber || (
                <span className="italic text-gray-400">No phone number</span>
              )}
            </p>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm">{formErrors.name}</p>
              )}
            </div>

            <div>
              <Label>Email</Label>
              <Input value={formData.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                Email can't be changed
              </p>
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone</Label>
              <div
                className={`w-full ${
                  formErrors.phoneNumber ? "border-red-500" : ""
                }`}
              >
                <PhoneInput
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="IN"
                  placeholder="Enter phone number"
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>
              {formErrors.phoneNumber && (
                <p className="text-red-500 text-sm">{formErrors.phoneNumber}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center">
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
