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
    // A full-width band directly under the console header rather than a card in
    // the content flow — a degraded account is a property of the whole session,
    // not of the page you happen to be on.
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warning-border bg-warning-subtle px-4 py-2 text-sm lg:px-6">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
        <span className="text-foreground">
          Your subscription isn&apos;t active. Existing data stays visible, but accepting new
          bookings, posting notices, and adding rooms are paused until you renew.
        </span>
      </div>
      <Link
        href="/hostel-admin/billing"
        className="shrink-0 rounded-sm font-medium text-warning underline underline-offset-4 transition-ui hover:text-foreground"
      >
        Renew now
      </Link>
    </div>
  );
}
