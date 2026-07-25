import type { ReactNode } from "react";
import { Role } from "@prisma/client";
import { Menu } from "lucide-react";
import { AdminNavigation } from "@/components/common-in-admin/AdminNavigation";
import { BackToDashboardLink } from "@/components/common-in-admin/BackToDashboardLink";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AdminLayoutShellProps {
  role: Role;
  children: ReactNode;
  topSlot?: ReactNode;
  sidebarTopSlot?: ReactNode;
  /** Overrides the default role-based <AdminNavigation> — e.g. /profile's
   * own section nav — while reusing this same sidebar shell. */
  navContent?: ReactNode;
  menuButtonClassName?: string;
  sheetContentClassName?: string;
  sidebarClassName?: string;
}

// Shared mobile Sheet + floating glass sidebar shell used by the Student,
// Hostel Admin, and Super Admin layouts (and the Profile page). The glass
// treatment (blur/border/shadow/radius) lives here, not in the per-caller
// sidebarClassName override, so every role gets the same surface instead of
// each layout hardcoding its own bg color.
export function AdminLayoutShell({
  role,
  children,
  topSlot,
  sidebarTopSlot,
  navContent,
  menuButtonClassName,
  sheetContentClassName = "w-[300px] p-0",
  sidebarClassName = "hidden w-64 md:block",
}: AdminLayoutShellProps) {
  const nav = navContent ?? <AdminNavigation role={role} />;
  // Pages that override navContent (e.g. /profile's own section nav) have no
  // "Dashboard" link in their sidebar at all, so a pinned way back is the
  // only escape hatch — shown for every role's sidebar for consistency.
  const backToDashboard = <BackToDashboardLink role={role} />;

  return (
    // Horizontal edge spacing already comes from the root layout's
    // container (px-4/6/8) — only vertical margin + the sidebar/content
    // gap belong here, otherwise every side stacks two paddings on top of
    // each other and eats a lot of width on small screens.
    <div className="flex min-h-screen gap-2 py-2 sm:gap-3 sm:py-3">
      {/* Mobile Navigation */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className={cn("h-6 w-6", menuButtonClassName)} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className={sheetContentClassName}>
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <div className="flex h-full min-h-0 flex-col">
            {sidebarTopSlot && <div className="border-b border-border/40 p-3">{sidebarTopSlot}</div>}
            <div className="min-h-0 flex-1 overflow-y-auto py-2">{nav}</div>
            {backToDashboard}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sidebar — sticky + height-capped to the viewport so it (and the
          "Back to Dashboard" footer) never grows past the screen even when
          the main column's content is very long; its own nav list scrolls
          internally instead. */}
      <div
        className={cn(
          "sticky top-16 max-h-[calc(100vh-5rem)] shrink-0 overflow-hidden rounded-3xl border border-border/50 bg-card/60 backdrop-blur-2xl shadow-glass-sm sm:top-20",
          sidebarClassName
        )}
      >
        <div className="flex h-full min-h-0 flex-col">
          {sidebarTopSlot && <div className="border-b border-border/40 p-3">{sidebarTopSlot}</div>}
          <div className="min-h-0 flex-1 overflow-y-auto py-2">{nav}</div>
          {backToDashboard}
        </div>
      </div>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex flex-1 flex-col gap-3">
          {topSlot}
          <div className="flex-1 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-2xl shadow-glass-sm p-4 sm:p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
