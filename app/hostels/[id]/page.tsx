"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { hostelApi } from "@/services/api";
import { HostelDetails } from "@/types";
import { MapPin, Star } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import HostelMap from "@/components/hostel/HostelMap";
import Image from "next/image";
import { BookingDialog } from "@/components/booking/BookingDialog";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { NoticeBoard } from "@/components/hostel/NoticeBoard";
import { JoinWaitlist } from "@/components/hostel/JoinWaitlist";
import { ROOM_STATUS, StatusBadge } from "@/components/ui/status-badge";
import { ADDITIONAL_FACILITIES } from "@/lib/room-facilities";
import { formatCurrency } from "@/lib/format";

export default function HostelDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [hostelId, setHostelId] = useState<string>("");
  const [hostel, setHostel] = useState<HostelDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params && params.id) {
      setHostelId(params.id as string);
    }
  }, [params]);

  const fetchHostel = async () => {
    if (!hostelId) return;

    try {
      setLoading(true);
      const data = await hostelApi.getById(hostelId);
      setHostel(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching hostel:", err);
      setError("Failed to load hostel details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostel();
  }, [hostelId]);

  if (loading) {
    return <LoadingSpinner fullPage message="Loading hostel details..." />;
  }

  if (error || !hostel) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p className="mt-2 text-muted-foreground">
            {error || "Hostel not found"}
          </p>
          <Button onClick={() => router.push("/hostels")} className="mt-4">
            Back to Hostels
          </Button>
        </Card>
      </div>
    );
  }

  const averageRating =
    hostel.reviews.length > 0
      ? hostel.reviews.reduce(
          (sum: number, r: { rating: number }) => sum + r.rating,
          0
        ) / hostel.reviews.length
      : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header with title and wishlist */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{hostel.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              {hostel.address}, {hostel.city}, {hostel.state} {hostel.zipCode}
            </p>
            {averageRating > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="font-semibold">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({hostel.reviews.length} reviews)
                </span>
              </div>
            )}
          </div>
          <WishlistButton hostelId={hostel.id} />
        </div>

        {/* Image Gallery */}
        {hostel.images && hostel.images.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h2 className="text-md font-semibold">Photos</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {hostel.images.map((image: string, index: number) => (
                  <div
                    key={index}
                    className="relative aspect-video overflow-hidden rounded-md border border-border"
                  >
                    <Image
                      src={image}
                      alt={`${hostel.name} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-md font-semibold">Description</h2>
            <p className="mt-2 text-muted-foreground">{hostel.description}</p>
          </div>

          <div>
            <h2 className="text-md font-semibold">Amenities</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {hostel.amenities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No amenities listed.
                </p>
              ) : (
                hostel.amenities.map((amenity, index) => (
                  <Badge key={index} variant="secondary">
                    {amenity}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        {hostel.latitude && hostel.longitude && (
          <>
            <Separator />
            <div>
              <h2 className="text-md font-semibold">Location</h2>
              <div className="mt-4 overflow-hidden rounded-md border border-border">
                <HostelMap
                  name={hostel.name}
                  latitude={hostel.latitude}
                  longitude={hostel.longitude}
                />
              </div>
            </div>
          </>
        )}

        <Separator />
        <NoticeBoard hostelId={hostel.id} />

        <Separator />

        {/* Available Rooms with Booking Dialog */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-md font-semibold">Available Rooms</h2>
            <JoinWaitlist hostelId={hostel.id} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hostel.rooms.map((room) => {
              const typeLabel =
                room.roomType === "CUSTOM" && room.customRoomType
                  ? room.customRoomType
                  : room.roomType;
              const title = room.roomName || typeLabel;
              const facilityBadges = room.amenities
                .map((key) => ADDITIONAL_FACILITIES.find((f) => f.key === key))
                .filter((f): f is (typeof ADDITIONAL_FACILITIES)[number] => !!f);

              return (
                <div
                  key={room.id}
                  className="flex flex-col gap-3 rounded-md border border-border p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Room {room.roomNumber} · {room.capacity}{" "}
                        {room.capacity === 1 ? "bed" : "beds"}
                        {room.roomName ? ` · ${typeLabel}` : ""}
                      </p>
                    </div>
                    <StatusBadge registry={ROOM_STATUS} value={room.status} size="sm" />
                  </div>

                  {room.description && (
                    <p className="text-sm text-muted-foreground">
                      {room.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {room.hasAttachedBathroom && (
                      <Badge variant="secondary">Attached Bathroom</Badge>
                    )}
                    {room.acType === "FAN_AC" && (
                      <Badge variant="secondary">AC</Badge>
                    )}
                    {room.cupboardType === "INDIVIDUAL" && (
                      <Badge variant="secondary">Individual Cupboard</Badge>
                    )}
                    {room.cupboardType === "SHARED" && (
                      <Badge variant="secondary">Shared Cupboard</Badge>
                    )}
                    {facilityBadges.map((facility) => (
                      <Badge key={facility.key} variant="secondary">
                        {facility.label}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="font-mono text-md font-semibold">
                      {formatCurrency(room.price)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /month
                      </span>
                    </span>
                    <BookingDialog room={room} hostelName={hostel.name} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Reviews Section */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-md font-semibold">
              Reviews ({hostel.reviews.length})
            </h2>
            <ReviewForm hostelId={hostel.id} onReviewAdded={fetchHostel} />
          </div>
          <div className="mt-4 space-y-4">
            {hostel.reviews.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No reviews yet. Be the first to review!
              </p>
            ) : (
              hostel.reviews.map((review, index) => (
                <div key={review.id}>
                  {index > 0 && <Separator className="mb-4" />}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {review.user.name || "Anonymous"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? "fill-warning text-warning"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
