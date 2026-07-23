"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building,
  CalendarCheck,
  Calendar,
  CreditCard,
  Home,
  ClipboardList,
  ListPlus,
  Megaphone,
  QrCode,
  Receipt,
  BarChart3,
  Settings,
  UserCheck,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { Role } from "@prisma/client";

interface AdminNavigationProps {
  role: Role;
}

type NavLink = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

function getNavLinks(role: Role): { links: NavLink[]; basePath: string } {
  if (role === Role.STUDENT) {
    return {
      basePath: "/dashboard",
      links: [
        { label: "Overview", href: "/dashboard", icon: Home },
        { label: "Bookings", href: "/dashboard/bookings", icon: Calendar },
        { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
        { label: "My QR Code", href: "/dashboard/qr-code", icon: QrCode },
        { label: "Profile", href: "/profile", icon: User },
        { label: "Settings", href: "/settings", icon: Settings },
      ],
    };
  }

  const isSuperAdmin = role === Role.SUPER_ADMIN;
  const basePath = isSuperAdmin ? "/super-admin" : "/hostel-admin";

  const links: NavLink[] = [
    { label: "Dashboard", href: basePath, icon: Home },
    { label: "Hostels", href: `${basePath}/hostels`, icon: Building },
    {
      label: isSuperAdmin ? "Hostel Admins" : "Students",
      href: `${basePath}/${isSuperAdmin ? "admins" : "students"}`,
      icon: Users,
    },
    ...(isSuperAdmin
      ? [{ label: "Analytics", href: `${basePath}/analytics`, icon: BarChart3 }]
      : [
          { label: "Bookings", href: `${basePath}/bookings`, icon: ClipboardList },
          { label: "Payments", href: `${basePath}/payments`, icon: CreditCard },
          { label: "Visitors", href: `${basePath}/visitors`, icon: UserCheck },
          { label: "Attendance", href: `${basePath}/attendance`, icon: CalendarCheck },
          { label: "Notices", href: `${basePath}/notices`, icon: Megaphone },
          { label: "Waitlist", href: `${basePath}/waitlist`, icon: ListPlus },
          { label: "Expenses", href: `${basePath}/expenses`, icon: Receipt },
          { label: "Analytics", href: `${basePath}/analytics`, icon: BarChart3 },
          { label: "Billing", href: `${basePath}/billing`, icon: Wallet },
        ]),
  ];

  return { basePath, links };
}

export function AdminNavigation({ role }: AdminNavigationProps) {
  const pathname = usePathname();
  const { links, basePath } = getNavLinks(role);

  const isActive = (href: string) =>
    href === basePath ? pathname === basePath : pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <nav className="grid items-start px-2 text-sm font-medium">
      {links.map(({ label, href, icon: Icon }) => (
        <Link
          key={label}
          href={href}
          className="flex items-center gap-3 rounded-lg px-3 py-2
            text-gray-500 transition-all
            hover:text-gray-900 dark:text-gray-400
            dark:hover:text-white
            data-[active=true]:bg-gray-100
            data-[active=true]:text-gray-900
            dark:data-[active=true]:bg-gray-800
            dark:data-[active=true]:text-white"
          data-active={isActive(href)}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
