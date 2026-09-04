"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Hostel } from "@/types";

interface HostelCardProps {
  hostel: Hostel;
}

/**
 * A hostel in the search results.
 *
 * The whole card is one link rather than a card containing a "View details"
 * button — the button added a second tab stop and a smaller hit target for the
 * same destination.
 */
export default function HostelCard({ hostel }: HostelCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const soldOut = hostel.availableRooms === 0;

  return (
    <Link
      href={`/hostels/${hostel.id}`}
      className="group flex flex-col overflow-hidden rounded-md border border-border bg-card transition-ui hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {hostel.images && hostel.images.length > 0 ? (
          <>
            {isImageLoading && <Skeleton className="absolute inset-0 rounded-none" />}
            <Image
              src={hostel.images[0]}
              alt={hostel.name}
              fill
              className={cn(
                "object-cover transition-opacity duration-300",
                isImageLoading ? "opacity-0" : "opacity-100"
              )}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoad={() => setIsImageLoading(false)}
            />
          </>
        ) : (
          <div className="blueprint-grid absolute inset-0 flex items-center justify-center">
            <Building2 className="size-8 text-faint" />
          </div>
        )}

        <span className="absolute right-2 top-2 rounded-sm border border-border bg-card/95 px-1.5 py-0.5 text-xs font-medium backdrop-blur-sm">
          <span className="font-mono">{formatCurrency(hostel.lowestPrice)}</span>
          <span className="text-muted-foreground">/mo</span>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
            {hostel.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="line-clamp-1">
              {hostel.city}, {hostel.state}
            </span>
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="flex items-center gap-1 text-xs">
            <Star className="size-3.5 fill-warning text-warning" />
            <span className="font-medium text-foreground">
              {hostel.averageRating.toFixed(1)}
            </span>
            <span className="text-muted-foreground">({hostel.reviewCount})</span>
          </span>

          <Badge variant={soldOut ? "neutral" : "success"}>
            {soldOut
              ? "Fully booked"
              : `${hostel.availableRooms} room${hostel.availableRooms === 1 ? "" : "s"} left`}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
