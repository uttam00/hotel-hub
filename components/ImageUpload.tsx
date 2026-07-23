"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { uploadApi } from "@/services/api";

interface ImageUploadProps {
  hideLabel?: boolean;
  value: string[];
  onChange: (urls: string[]) => void;
  onRemove: (url: string) => void;
  maxImages?: number;
  folder?: string;
}

export default function ImageUpload({
  hideLabel = false,
  value,
  onChange,
  onRemove,
  maxImages = 5,
  folder = "hostels",
}: ImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error("Error compressing image:", error);
      return file; // Return original file if compression fails
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const compressed = await compressImage(file);
    try {
      const data = await uploadApi.uploadImage(compressed, folder);
      return data.url;
    } catch {
      return null;
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const slotsLeft = maxImages - value.length;
    const filesToUpload = Array.from(files).slice(0, slotsLeft);

    setIsProcessing(true);
    try {
      const results = await Promise.all(filesToUpload.map(uploadImage));
      const uploaded = results.filter((url): url is string => !!url);

      if (uploaded.length < filesToUpload.length) {
        toast.error("Some images failed to upload. Please try those again.");
      }

      if (uploaded.length > 0) {
        onChange([...value, ...uploaded]);
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
    } finally {
      setIsProcessing(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...value];
    const urlToRemove = newImages[index];
    newImages.splice(index, 1);
    onRemove(urlToRemove);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {value.map((url, index) => (
          <div key={index} className="relative aspect-square">
            <Image
              src={url}
              alt={`Image ${index + 1}`}
              fill
              className="rounded-lg object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => removeImage(index)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      {value.length < maxImages && (
        <div className="space-y-2">
          {!hideLabel && <Label htmlFor="images">Upload Images</Label>}
          <Input
            id="images"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImageChange}
            disabled={isProcessing}
          />
          {isProcessing && (
            <p className="text-sm text-muted-foreground">
              Uploading images...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
