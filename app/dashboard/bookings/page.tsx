"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { bookingApi } from "@/services/api";
import { BookingDetails } from "@/types";
import { getBookingStatusColor } from "@/lib/status-colors";
import { Calendar, MapPin, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function StudentBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await bookingApi.getAll({});
        setBookings(response.data || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchBookings();
    }
  }, [session]);

  if (status === "loading" || loading) {
    return <LoadingSpinner fullPage message="Loading your bookings..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-muted-foreground">
            View and manage your hostel bookings
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No bookings yet</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">
              You haven't made any bookings. Browse hostels to find your perfect stay.
            </p>
            <Link href="/hostels">
              <Button>Browse Hostels</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {booking.room?.hostel?.name || "Hostel Booking"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {booking.room?.hostel?.city}, {booking.room?.hostel?.state}
                    </CardDescription>
                  </div>
                  <Badge className={getBookingStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Room</p>
                    <p className="font-medium flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      {booking.room?.roomType} — #{booking.room?.roomNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Check-in</p>
                    <p className="font-medium">
                      {new Date(booking.checkIn).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Check-out</p>
                    <p className="font-medium">
                      {new Date(booking.checkOut).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Price</p>
                    <p className="font-semibold text-primary">
                      ${booking.totalPrice?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
