"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ListPlus } from "lucide-react";

const ROOM_TYPES = ["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY"];

export function JoinWaitlist({ hostelId }: { hostelId: string }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [roomType, setRoomType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!session) {
      toast.error("Please log in to join the waitlist");
      return;
    }
    if (!roomType) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/hostels/${hostelId}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomType }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join waitlist");
      }
      toast.success("You're on the waitlist — we'll notify you when a room opens up.");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join waitlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ListPlus className="mr-2 h-4 w-4" /> Join Waitlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Join the Waitlist</DialogTitle>
        </DialogHeader>
        <Select value={roomType} onValueChange={setRoomType}>
          <SelectTrigger><SelectValue placeholder="Select a room type" /></SelectTrigger>
          <SelectContent>
            {ROOM_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={handleJoin} disabled={loading || !roomType}>
            {loading ? "Joining..." : "Join Waitlist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
