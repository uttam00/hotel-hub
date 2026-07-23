"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { bookingApi } from "@/services/api";
import { format, differenceInDays } from "date-fns";

interface BookingDialogProps {
  room: {
    id: string;
    roomNumber: string;
    roomType: string;
    price: number;
    isAvailable: boolean;
  };
  hostelName: string;
}

export function BookingDialog({ room, hostelName }: BookingDialogProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const days =
    checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const totalPrice = days * (room.price / 30); // daily rate from monthly price

  const handleBook = async () => {
    if (!session) {
      router.push("/auth/login");
      return;
    }

    if (!checkIn || !checkOut) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    if (checkIn >= checkOut) {
      toast.error("Check-out must be after check-in");
      return;
    }

    setLoading(true);
    try {
      await bookingApi.create({
        roomId: room.id,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        totalPrice: Math.round(totalPrice * 100) / 100,
      });

      toast.success("Booking created successfully!");
      setOpen(false);
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error?.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!room.isAvailable} size="sm">
          {room.isAvailable ? "Book Now" : "Unavailable"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Book Room</DialogTitle>
          <DialogDescription>
            {hostelName} — {room.roomType} (Room {room.roomNumber})
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Check-in</Label>
              <Calendar
                mode="single"
                selected={checkIn}
                onSelect={setCheckIn}
                disabled={(date) => date < new Date()}
                className="rounded-md border mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Check-out</Label>
              <Calendar
                mode="single"
                selected={checkOut}
                onSelect={setCheckOut}
                disabled={(date) =>
                  date < new Date() || (checkIn ? date <= checkIn : false)
                }
                className="rounded-md border mt-1"
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Room price</span>
              <span>${room.price}/month</span>
            </div>
            {checkIn && checkOut && (
              <>
                <div className="flex justify-between text-sm">
                  <span>Duration</span>
                  <span>{days} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Dates</span>
                  <span>
                    {format(checkIn, "MMM d")} – {format(checkOut, "MMM d, yyyy")}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleBook}
            disabled={loading || !checkIn || !checkOut}
          >
            {loading ? "Booking..." : `Confirm Booking`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
