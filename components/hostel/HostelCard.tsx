"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hostel } from "@/types";
import { Building, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface HostelCardProps {
  hostel: Hostel;
}

export default function HostelCard({ hostel }: HostelCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video w-full bg-muted relative">
        {hostel.images && hostel.images.length > 0 ? (
          <>
            {isImageLoading && <Skeleton className="absolute inset-0" />}
            <Image
              src={hostel.images[0]}
              alt={hostel.name}
              fill
              className={`object-cover transition-opacity duration-300 ${
                isImageLoading ? "opacity-0" : "opacity-100"
              }`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
              onLoadingComplete={() => setIsImageLoading(false)}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        <Badge className="absolute right-3 top-3 border-none bg-background/90 text-foreground shadow-sm backdrop-blur-sm">
          From ${hostel.lowestPrice}/mo
        </Badge>
      </div>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="line-clamp-1 text-lg">{hostel.name}</CardTitle>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="line-clamp-1">
            {hostel.city}, {hostel.state}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="text-sm font-medium">
              {hostel.averageRating.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              ({hostel.reviewCount})
            </span>
          </div>
          <Badge variant="secondary">
            {hostel.availableRooms} {hostel.availableRooms === 1 ? "room" : "rooms"} left
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link href={`/hostels/${hostel.id}`} className="w-full">
          <Button className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
