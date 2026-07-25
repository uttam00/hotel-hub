"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { subscriptionApi } from "@/services/api";

export function SubscriptionBanner() {
  const { hostel } = useMyHostel();
  const [isLimited, setIsLimited] = useState(false);

  useEffect(() => {
    if (!hostel) return;
    subscriptionApi
      .get(hostel.id)
      .then((data) => setIsLimited(data.accessLevel === "LIMITED"))
      .catch(() => {
        // No hostel yet, or not reachable — say nothing rather than a false alarm.
      });
  }, [hostel]);

  if (!isLimited) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          Your subscription isn&apos;t active. Existing rooms and bookings stay visible, but
          adding rooms and accepting new bookings is paused until you renew.
        </span>
      </div>
      <Link href="/hostel-admin/billing" className="shrink-0 font-medium underline underline-offset-4">
        Renew now
      </Link>
    </div>
  );
}
