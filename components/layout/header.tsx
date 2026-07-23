"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building } from "lucide-react";
import { UserAccountNav } from "@/components/auth/user-account-nav";
import { useSession } from "next-auth/react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const isAdmin = role === "SUPER_ADMIN" || role === "HOSTEL_ADMIN";
  // While the session is still resolving, we don't yet know the role — treat
  // that as "not settled" rather than defaulting to the public/student nav,
  // which is what previously flashed the wrong header at a logged-in admin.
  const showPublicNav = status !== "loading" && !isAdmin;

  // Role-based logo redirect
  const logoHref =
    role === "SUPER_ADMIN"
      ? "/super-admin"
      : role === "HOSTEL_ADMIN"
      ? "/hostel-admin"
      : "/";

  // Student/public nav links
  const studentNavLinks = [
    { href: "/", label: "Home" },
    { href: "/hostels", label: "Hostels" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  // Check if a nav link is active
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b w-full bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between py-4">
        <Link href={logoHref} className="flex items-center gap-2">
          <Building className="h-6 w-6" />
          <span className="text-xl font-bold">HostelHub</span>
        </Link>
        {showPublicNav && (
          <nav className="hidden md:flex items-center gap-6">
            {studentNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell />
          <UserAccountNav />
        </div>
      </div>
    </header>
  );
}
