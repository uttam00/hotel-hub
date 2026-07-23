"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WishlistButtonProps {
  hostelId: string;
  initialWishlisted?: boolean;
}

export function WishlistButton({
  hostelId,
  initialWishlisted = false,
}: WishlistButtonProps) {
  const { data: session } = useSession();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!session) {
      toast.error("Please log in to save hostels");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostelId }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setWishlisted(data.action === "added");
      toast.success(
        data.action === "added" ? "Added to wishlist" : "Removed from wishlist"
      );
    } catch {
      toast.error("Failed to update wishlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle();
      }}
      disabled={loading}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          wishlisted
            ? "fill-red-500 text-red-500"
            : "text-muted-foreground hover:text-red-500"
        }`}
      />
    </Button>
  );
}
