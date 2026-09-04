"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * A single sidebar row.
 *
 * The active state is a brand-tinted panel with a solid 2px rule down its left
 * edge — clear at a glance without shouting, and the rule reinforces the
 * vertical structure the whole sidebar is built on. Colour alone doesn't carry
 * it: the icon and label also go to full contrast, and aria-current marks it
 * for assistive tech.
 */
export function SidebarNavLink({
  href,
  icon: Icon,
  label,
  active,
  badge,
  collapsed = false,
  onNavigate,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  /** Contextual count, e.g. unread notices or people awaiting review. */
  badge?: number;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-sm py-1.5 text-sm transition-ui",
        collapsed ? "justify-center px-0" : "px-2.5",
        active
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar"
      )}
    >
      {active && (
        <span
          className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-sidebar-primary"
          aria-hidden="true"
        />
      )}
      <Icon
        className={cn(
          "size-4 shrink-0 transition-ui",
          active ? "text-sidebar-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground"
        )}
      />
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && badge != null && badge > 0 && (
        <span className="ml-auto shrink-0 rounded-sm bg-sidebar-primary px-1 py-px text-2xs font-semibold tabular-nums text-sidebar-primary-foreground">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {collapsed && badge != null && badge > 0 && (
        <span
          className="absolute right-1 top-1 size-1.5 rounded-full bg-sidebar-primary"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}
