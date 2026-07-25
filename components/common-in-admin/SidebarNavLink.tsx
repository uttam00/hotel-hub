"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

// The single styled nav-item link used by every sidebar in the app
// (AdminNavigation for the role dashboards, ProfileNav for /profile) so
// they stay visually identical instead of drifting apart as separately
// copy-pasted classNames.
export function SidebarNavLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium",
        "text-muted-foreground transition-glass hover:bg-accent/50 hover:text-foreground",
        active && "bg-primary/90 text-primary-foreground shadow-glass-sm backdrop-blur-xl hover:bg-primary hover:text-primary-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
