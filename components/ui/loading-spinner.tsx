"use client";

import { BrandSpinner } from "@/components/ui/brand-spinner";

interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  message = "Loading...",
  fullPage = false,
  size = "md",
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <BrandSpinner size={size} className="text-primary" />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
