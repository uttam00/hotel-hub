import {
  BarChart3,
  Building2,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  DoorOpen,
  Home,
  LayoutGrid,
  ListPlus,
  Megaphone,
  QrCode,
  Receipt,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Role } from "@prisma/client";

import { getDashboardPath } from "@/lib/route-access";

/**
 * The console's information architecture.
 *
 * Grouped into the sections a hostel is actually run by — Residents, Property,
 * Finance, Operations — rather than presented as one flat list of twelve links,
 * which is what made the previous sidebar hard to scan.
 *
 * DELIBERATELY ABSENT: Complaints, Maintenance, Mess, Staff, Tasks, Documents
 * and Role management. The schema has no models for any of them, so a nav entry
 * would lead to a page with nothing real behind it. They belong here the moment
 * the data does.
 */

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Shown in the command palette to disambiguate similar entries. */
  hint?: string;
  /** Marks the item active only on an exact path match. */
  exact?: boolean;
}

export interface NavSection {
  /** Omitted for the first group, which needs no heading above the dashboard. */
  label?: string;
  items: NavItem[];
}

export function getNavSections(role: Role): NavSection[] {
  const base = getDashboardPath(role);

  if (role === Role.STUDENT) {
    return [
      {
        items: [{ label: "Overview", href: "/dashboard", icon: LayoutGrid, exact: true }],
      },
      {
        label: "My stay",
        items: [
          {
            label: "Bookings",
            href: "/dashboard/bookings",
            icon: ClipboardList,
            hint: "Your rooms and stay dates",
          },
          {
            label: "Payments",
            href: "/dashboard/payments",
            icon: CreditCard,
            hint: "Fees, dues and receipts",
          },
          {
            label: "Entry pass",
            href: "/dashboard/qr-code",
            icon: QrCode,
            hint: "QR code for attendance",
          },
        ],
      },
      {
        // Students are marketplace users as well as residents — without these
        // the console is a dead end, because the public site's header isn't
        // rendered inside the dashboard shell.
        label: "Explore",
        items: [
          {
            label: "Find a hostel",
            href: "/hostels",
            icon: Search,
            hint: "Browse and book a room",
          },
          { label: "Home", href: "/", icon: Home, exact: true },
        ],
      },
      {
        label: "Account",
        items: [{ label: "Profile", href: "/profile", icon: User }],
      },
    ];
  }

  if (role === Role.SUPER_ADMIN) {
    return [
      {
        items: [{ label: "Dashboard", href: base, icon: LayoutGrid, exact: true }],
      },
      {
        label: "Network",
        items: [
          {
            label: "Hostels",
            href: `${base}/hostels`,
            icon: Building2,
            hint: "Every property on the platform",
          },
          {
            label: "Hostel admins",
            href: `${base}/admins`,
            icon: ShieldCheck,
            hint: "Operators and their assignments",
          },
        ],
      },
      {
        label: "Insights",
        items: [
          {
            label: "Analytics",
            href: `${base}/analytics`,
            icon: BarChart3,
            hint: "Occupancy and revenue across the network",
          },
        ],
      },
    ];
  }

  // HOSTEL_ADMIN — the operational console.
  return [
    {
      items: [{ label: "Dashboard", href: base, icon: LayoutGrid, exact: true }],
    },
    {
      label: "Residents",
      items: [
        {
          label: "Residents",
          href: `${base}/students`,
          icon: Users,
          hint: "Everyone staying at your hostel",
        },
        {
          label: "Bookings",
          href: `${base}/bookings`,
          icon: ClipboardList,
          hint: "Check-ins, check-outs and stay records",
        },
        {
          label: "Attendance",
          href: `${base}/attendance`,
          icon: CalendarCheck,
          hint: "Daily present, absent and leave",
        },
        {
          label: "Visitors",
          href: `${base}/visitors`,
          icon: UserCheck,
          hint: "Who is on the premises right now",
        },
        {
          label: "Waitlist",
          href: `${base}/waitlist`,
          icon: ListPlus,
          hint: "Students waiting for a place",
        },
      ],
    },
    {
      label: "Property",
      items: [
        {
          label: "Occupancy plan",
          href: `${base}/occupancy`,
          icon: DoorOpen,
          hint: "Floor, room and bed map",
        },
        {
          label: "Hostels",
          href: `${base}/hostels`,
          icon: Building2,
          hint: "Rooms, pricing and details",
        },
      ],
    },
    {
      label: "Finance",
      items: [
        {
          label: "Payments",
          href: `${base}/payments`,
          icon: CreditCard,
          hint: "Collections, dues and refunds",
        },
        {
          label: "Expenses",
          href: `${base}/expenses`,
          icon: Receipt,
          hint: "What the hostel spends",
        },
        {
          label: "Billing",
          href: `${base}/billing`,
          icon: Wallet,
          hint: "Your HostelHub subscription",
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          label: "Notices",
          href: `${base}/notices`,
          icon: Megaphone,
          hint: "Announcements to residents",
        },
      ],
    },
    {
      label: "Insights",
      items: [
        {
          label: "Analytics",
          href: `${base}/analytics`,
          icon: BarChart3,
          hint: "Occupancy and revenue trends",
        },
      ],
    },
  ];
}

/** Flattened list, for the command palette's navigation results. */
export function getNavItems(role: Role): NavItem[] {
  return getNavSections(role).flatMap((s) => s.items);
}

export function isNavItemActive(item: NavItem, pathname: string | null): boolean {
  if (!pathname) return false;
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
