"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";

import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { UserAccountNav } from "@/components/auth/user-account-nav";
import { useOptionalHostelContext } from "@/contexts/hostel-context";

/**
 * The console's top bar: search on the left, status and account on the right.
 *
 * The search control is a button, not an input — it opens the command palette,
 * and showing the ⌘K shortcut on the control is how people learn the shortcut
 * exists. It dispatches a synthetic keydown so there is exactly one code path
 * that opens the palette, whether by keyboard or by click.
 */
export function ConsoleHeader({ menuSlot }: { menuSlot?: ReactNode }) {
  const hostelCtx = useOptionalHostelContext();
  const hostelName = hostelCtx?.selectedHostel?.name;

  const openPalette = () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    );
  };

  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card/95 px-3 backdrop-blur-sm">
      {menuSlot}

      <button
        type="button"
        onClick={openPalette}
        className="group flex h-8 min-w-0 flex-1 items-center gap-2 rounded-sm border border-border bg-surface-sunken px-2.5 text-sm text-muted-foreground transition-ui hover:border-border-strong hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-sm"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="truncate">Search residents, rooms and pages…</span>
        <kbd className="ml-auto hidden shrink-0 rounded-[3px] border border-border bg-card px-1 font-mono text-2xs text-faint sm:block">
          ⌘K
        </kbd>
      </button>

      {/* Which property you are acting on — the single most important piece of
          context in a multi-hostel account, and the easiest to lose track of. */}
      {hostelName && (
        <span className="ml-1 hidden min-w-0 items-center gap-1.5 text-sm lg:flex">
          <span className="text-muted-foreground">Managing</span>
          <span className="truncate font-medium text-foreground">{hostelName}</span>
        </span>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-0.5">
        <ThemeToggle />
        <NotificationBell />
        <UserAccountNav />
      </div>
    </header>
  );
}
