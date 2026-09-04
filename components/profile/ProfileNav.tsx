"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Contact, KeyRound, User } from "lucide-react";

import { cn } from "@/lib/utils";

const BASE_SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "password", label: "Password", icon: KeyRound },
];

/**
 * The profile page's section switcher.
 *
 * This used to replace the entire sidebar, which meant that opening Profile
 * wiped out every other navigation link in the product — the console suddenly
 * had three items in it and no way back to Residents or Payments except the
 * one pinned "back" link. It is now an in-page tab bar, so the main navigation
 * stays exactly where it was and only the content area changes.
 *
 * Still driven by the `?tab=` query parameter, so existing links keep working.
 */
export function ProfileNav({ showEmergency }: { showEmergency: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? "profile";

  const sections = showEmergency
    ? [...BASE_SECTIONS, { id: "emergency", label: "Emergency contacts", icon: Contact }]
    : BASE_SECTIONS;

  return (
    <nav
      className="no-scrollbar flex h-9 items-center gap-4 overflow-x-auto border-b border-border"
      aria-label="Profile sections"
    >
      {sections.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <Link
            key={id}
            href={id === "profile" ? pathname : `${pathname}?tab=${id}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative -mb-px inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-0.5 text-sm font-medium transition-ui",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
