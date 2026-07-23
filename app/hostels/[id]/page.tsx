"use client";

import { Button } from "@/components/ui/button";
import { hostelApi } from "@/services/api";
import { HostelDetails } from "@/types";
import { Star } from "lucide-react";
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
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p className="mt-2 text-muted-foreground">
            {error || "Hostel not found"}
          </p>
          <Button onClick={() => router.push("/hostels")} className="mt-4">
            Back to Hostels
          </Button>
        </div>
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
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header with title and wishlist */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{hostel.name}</h1>
            <p className="mt-2 text-muted-foreground">
              {hostel.address}, {hostel.city}, {hostel.state} {hostel.zipCode}
            </p>
            {averageRating > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
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
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Photos</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {hostel.images.map((image: string, index: number) => (
                <div key={index} className="relative aspect-video">
                  <Image
                    src={image}
                    alt={`${hostel.name} - Image ${index + 1}`}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">Description</h2>
            <p className="mt-2 text-muted-foreground">{hostel.description}</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Amenities</h2>
            <ul className="mt-2 grid grid-cols-2 gap-2">
              {hostel.amenities.map((amenity, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {amenity}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {hostel.latitude && hostel.longitude && (
          <div>
            <h2 className="text-xl font-semibold">Location</h2>
            <div className="mt-4 rounded-lg overflow-hidden">
              <HostelMap
                name={hostel.name}
                latitude={hostel.latitude}
                longitude={hostel.longitude}
              />
            </div>
          </div>
        )}

        <NoticeBoard hostelId={hostel.id} />

        {/* Available Rooms with Booking Dialog */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Available Rooms</h2>
            <JoinWaitlist hostelId={hostel.id} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hostel.rooms.map((room) => (
              <div
                key={room.id}
                className="rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{room.roomType}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      room.isAvailable
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {room.isAvailable ? "Available" : "Occupied"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Room {room.roomNumber} · Capacity: {room.capacity}
                </p>
                {room.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {room.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold">
                    ${room.price}/month
                  </span>
                  <BookingDialog room={room} hostelName={hostel.name} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews Section */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Reviews ({hostel.reviews.length})
            </h2>
            <ReviewForm hostelId={hostel.id} onReviewAdded={fetchHostel} />
          </div>
          <div className="mt-4 space-y-4">
            {hostel.reviews.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No reviews yet. Be the first to review!
              </p>
            ) : (
              hostel.reviews.map((review) => (
                <div key={review.id} className="rounded-lg border p-4">
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
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-200"
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
