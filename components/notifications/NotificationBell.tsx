"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Bell,
  BellOff,
  CalendarCheck,
  CheckCheck,
  CreditCard,
  Info,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmptyState } from "@/components/ui/empty-state";
import { notificationApi } from "@/services/api";
import { formatRelativeDay, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

/**
 * The notification centre (§20).
 *
 * An operations inbox, not a social feed: each entry is typed, carries the icon
 * of the thing it concerns, and states when it happened. Unread items are
 * marked with a rule down the left edge and a dot — not just a tinted
 * background, which disappears against the dark theme.
 */

const TYPE_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; tone: string; label: string }
> = {
  PAYMENT: { icon: CreditCard, tone: "text-success", label: "Payment" },
  BOOKING: { icon: CalendarCheck, tone: "text-info", label: "Booking" },
  SUBSCRIPTION: { icon: Wallet, tone: "text-warning", label: "Subscription" },
  VERIFICATION: { icon: ShieldCheck, tone: "text-primary", label: "Verification" },
  GENERAL: { icon: Info, tone: "text-muted-foreground", label: "Notice" },
};

export function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!session) return;

    const fetchNotifications = async () => {
      try {
        const data = await notificationApi.getAll();
        setNotifications(data);
      } catch {
        // Non-critical: a failed poll should never surface an error to someone
        // in the middle of another task.
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic: the dot disappears immediately, and a failed request simply
    // leaves the server state to be corrected by the next poll.
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await notificationApi.markAsRead(id);
    } catch {
      /* next poll reconciles */
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await Promise.allSettled(unread.map((n) => notificationApi.markAsRead(n.id)));
  }, [notifications]);

  if (!session) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label={
            unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
          }
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex size-1.5 rounded-full bg-danger ring-2 ring-card" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[22rem] p-0" align="end">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div>
            <h2 className="text-sm font-semibold">Notifications</h2>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "Everything is read"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="xs" onClick={markAllAsRead}>
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[22rem] overflow-y-auto">
          {notifications.length === 0 ? (
            <EmptyState
              variant="inline"
              icon={BellOff}
              title="Nothing needs your attention"
              description="Payment, booking and verification updates will appear here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((notification) => {
                const meta = TYPE_META[notification.type] ?? TYPE_META.GENERAL;
                const Icon = meta.icon;
                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => !notification.read && markAsRead(notification.id)}
                      className={cn(
                        "relative flex w-full gap-2.5 px-3 py-2.5 text-left transition-ui hover:bg-muted/60",
                        !notification.read && "bg-primary-subtle/40"
                      )}
                    >
                      {!notification.read && (
                        <span
                          className="absolute inset-y-0 left-0 w-0.5 bg-primary"
                          aria-hidden="true"
                        />
                      )}
                      <Icon className={cn("mt-0.5 size-4 shrink-0", meta.tone)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p
                            className={cn(
                              "truncate text-sm",
                              notification.read ? "text-foreground" : "font-medium text-foreground"
                            )}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="sr-only">Unread</span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-2xs text-faint">
                          {formatRelativeDay(notification.createdAt)} ·{" "}
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
