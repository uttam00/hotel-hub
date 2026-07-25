"use client";

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
  UserCheck,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { Role } from "@prisma/client";
import { getDashboardPath } from "@/lib/route-access";
import { SidebarNavLink } from "@/components/common-in-admin/SidebarNavLink";

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
      basePath: getDashboardPath(role),
      links: [
        { label: "Overview", href: "/dashboard", icon: Home },
        { label: "Bookings", href: "/dashboard/bookings", icon: Calendar },
        { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
        { label: "My QR Code", href: "/dashboard/qr-code", icon: QrCode },
        { label: "Profile", href: "/profile", icon: User },
      ],
    };
  }

  const isSuperAdmin = role === Role.SUPER_ADMIN;
  const basePath = getDashboardPath(role);

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
      {links.map(({ label, href, icon }) => (
        <SidebarNavLink key={label} href={href} icon={icon} label={label} active={isActive(href)} />
      ))}
    </nav>
  );
}
