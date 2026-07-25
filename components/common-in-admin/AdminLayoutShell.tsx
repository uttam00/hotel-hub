import type { ReactNode } from "react";
import { Role } from "@prisma/client";
import { Menu } from "lucide-react";
import { AdminNavigation } from "@/components/common-in-admin/AdminNavigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AdminLayoutShellProps {
  role: Role;
  children: ReactNode;
  topSlot?: ReactNode;
  sidebarTopSlot?: ReactNode;
  menuButtonClassName?: string;
  sheetContentClassName?: string;
  sidebarClassName?: string;
}

// Shared mobile Sheet + fixed desktop sidebar shell used by the Student,
// Hostel Admin, and Super Admin layouts. Each caller passes its own
// classNames so today's per-role visual differences are preserved exactly.
export function AdminLayoutShell({
  role,
  children,
  topSlot,
  sidebarTopSlot,
  menuButtonClassName,
  sheetContentClassName = "w-[300px] p-0",
  sidebarClassName = "hidden w-64 border-r bg-gray-50/40 dark:bg-gray-900 md:block",
}: AdminLayoutShellProps) {
  return (
    <div className="flex min-h-screen">
      {/* Mobile Navigation */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className={cn("h-6 w-6", menuButtonClassName)} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className={sheetContentClassName}>
          <div className="flex h-full flex-col">
            {sidebarTopSlot && <div className="border-b p-3">{sidebarTopSlot}</div>}
            <div className="flex-1 overflow-auto py-2">
              <AdminNavigation role={role} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sidebar */}
      <div className={sidebarClassName}>
        <div className="flex h-full flex-col">
          {sidebarTopSlot && <div className="border-b p-3">{sidebarTopSlot}</div>}
          <div className="flex-1 overflow-auto py-2">
            <AdminNavigation role={role} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <main className="flex-1 p-4 md:p-8">
          {topSlot}
          {children}
        </main>
      </div>
    </div>
  );
}
