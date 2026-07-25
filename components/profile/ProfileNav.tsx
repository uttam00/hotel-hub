"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { User, KeyRound, Contact } from "lucide-react";
import { SidebarNavLink } from "@/components/common-in-admin/SidebarNavLink";

const BASE_SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "password", label: "Change Password", icon: KeyRound },
];

// /profile's own section nav, rendered through the same AdminLayoutShell
// sidebar every dashboard uses (via its navContent override) — same look,
// but never registered inside AdminNavigation, so it doesn't become a link
// in the main dashboard sidebars.
export function ProfileNav({ showEmergency }: { showEmergency: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? "profile";

  const sections = showEmergency
    ? [...BASE_SECTIONS, { id: "emergency", label: "Emergency Contacts", icon: Contact }]
    : BASE_SECTIONS;

  return (
    <nav className="grid items-start px-2 text-sm font-medium">
      {sections.map(({ id, label, icon }) => (
        <SidebarNavLink
          key={id}
          href={id === "profile" ? pathname : `${pathname}?tab=${id}`}
          icon={icon}
          label={label}
          active={active === id}
        />
      ))}
    </nav>
  );
}
