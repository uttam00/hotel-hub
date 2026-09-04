"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Role } from "@prisma/client";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { AdminNavigation } from "@/components/common-in-admin/AdminNavigation";
import { CommandPalette } from "@/components/common-in-admin/CommandPalette";
import { ConsoleHeader } from "@/components/common-in-admin/ConsoleHeader";
import { BackToDashboardLink } from "@/components/common-in-admin/BackToDashboardLink";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "hostelhub:sidebarCollapsed";

interface AdminLayoutShellProps {
  role: Role;
  children: ReactNode;
  /** Full-width band under the header — subscription warnings and the like. */
  topSlot?: ReactNode;
  /** Sits directly beneath the logo in the sidebar (the hostel selector). */
  sidebarTopSlot?: ReactNode;
  /** Replaces the role's default nav, e.g. the profile section's own nav. */
  navContent?: ReactNode;
}

/**
 * The operations console shell.
 *
 * A fixed dark sidebar and a light working area — the shell stays put while
 * only the content column scrolls, which is what makes a console feel like an
 * application rather than a website. The sidebar collapses to an icon rail for
 * users who want maximum width for wide tables; the choice persists.
 *
 * Replaces the previous floating translucent panel that sat inside the site's
 * centered container, which squeezed the working area and drifted with scroll.
 */
export function AdminLayoutShell({
  role,
  children,
  topSlot,
  sidebarTopSlot,
  navContent,
}: AdminLayoutShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Read after mount: localStorage isn't available during SSR, and reading it
  // in useState's initialiser would produce a hydration mismatch.
  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const nav = navContent ?? (
    <AdminNavigation
      role={role}
      collapsed={collapsed}
      onNavigate={() => setMobileOpen(false)}
    />
  );

  const mobileNav = navContent ?? (
    <AdminNavigation role={role} onNavigate={() => setMobileOpen(false)} />
  );

  return (
    <div className="flex min-h-screen bg-background">
      <CommandPalette role={role} />

      {/* ---------- Desktop sidebar ---------- */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex",
          collapsed ? "w-14" : "w-60"
        )}
      >
        <div
          className={cn(
            "flex h-12 shrink-0 items-center border-b border-sidebar-border",
            collapsed ? "justify-center px-2" : "px-3"
          )}
        >
          {/* The mark doubles as the way back to the public site — the console
              has no marketing header, so without this there is no route out. */}
          <Link
            href="/"
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            aria-label="HostelHub home"
          >
            {collapsed ? <LogoMark size="sm" /> : <Logo size="sm" tone="inverted" />}
          </Link>
        </div>

        {sidebarTopSlot && !collapsed && (
          <div className="shrink-0 border-b border-sidebar-border p-2">{sidebarTopSlot}</div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto py-3">{nav}</div>

        <div className="shrink-0 border-t border-sidebar-border p-2">
          <BackToDashboardLink role={role} collapsed={collapsed} />
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "mt-1 flex w-full items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-sm text-sidebar-foreground transition-ui hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="size-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ---------- Mobile sidebar ---------- */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[17rem] border-sidebar-border bg-sidebar p-0 sm:max-w-[17rem]"
        >
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <div className="flex h-12 shrink-0 items-center border-b border-sidebar-border px-3">
            <Link href="/" aria-label="HostelHub home" onClick={() => setMobileOpen(false)}>
              <Logo size="sm" tone="inverted" />
            </Link>
          </div>
          {sidebarTopSlot && (
            <div className="shrink-0 border-b border-sidebar-border p-2">{sidebarTopSlot}</div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto py-3">{mobileNav}</div>
          <div className="shrink-0 border-t border-sidebar-border p-2">
            <BackToDashboardLink role={role} />
          </div>
        </SheetContent>

        {/* ---------- Working area ---------- */}
        <div className="flex min-w-0 flex-1 flex-col">
          <ConsoleHeader
            menuSlot={
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="md:hidden">
                  <Menu className="size-4" />
                  <span className="sr-only">Open navigation</span>
                </Button>
              </SheetTrigger>
            }
          />
          {topSlot}
          <main id="main" className="min-w-0 flex-1 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </Sheet>
    </div>
  );
}
