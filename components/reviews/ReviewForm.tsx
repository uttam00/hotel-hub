"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { reviewApi } from "@/services/api";

interface ReviewFormProps {
  hostelId: string;
  onReviewAdded?: () => void;
}

export function ReviewForm({ hostelId, onReviewAdded }: ReviewFormProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!session) {
      toast.error("Please log in to leave a review");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setLoading(true);
    try {
      await reviewApi.create(hostelId, { rating, comment: comment || undefined });

      toast.success("Review submitted!");
      setOpen(false);
      setRating(0);
      setComment("");
      onReviewAdded?.();
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Write a Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Share your experience with other students
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-0.5"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment (optional)</Label>
            <Textarea
              id="comment"
              placeholder="Tell others about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || rating === 0}>
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
