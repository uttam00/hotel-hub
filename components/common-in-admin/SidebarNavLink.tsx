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
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
        "text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
        active && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
