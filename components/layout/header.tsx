"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { UserAccountNav } from "@/components/auth/user-account-nav";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getDashboardPath } from "@/lib/route-access";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/hostels", label: "Hostels" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/**
 * The marketplace header. Flat and rule-separated rather than a floating
 * translucent pill, so it belongs to the same system as the console.
 */
export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : Boolean(pathname?.startsWith(href));

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href={role ? getDashboardPath(role) : "/"} className="shrink-0">
          <Logo size="sm" />
        </Link>

        <nav className="hidden items-center gap-5 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "rounded-sm text-sm transition-ui",
                isActive(link.href)
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <ThemeToggle />
          {/* Wait for the session to resolve before choosing between the
              signed-in controls and the sign-in buttons — rendering either one
              early flashes the wrong header at a logged-in user. */}
          {status === "loading" ? null : session?.user ? (
            <>
              <NotificationBell />
              <UserAccountNav />
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/register">Get started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
