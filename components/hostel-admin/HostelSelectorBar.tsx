"use client";

import { Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHostelContext } from "@/contexts/hostel-context";

// Rendered at the top of the sidebar (both the desktop rail and the mobile
// Sheet), above the nav links — a workspace-switcher-style control rather
// than a bar competing with page content or banners. If the admin manages
// exactly one hostel there is nothing to choose, so it renders as a plain
// static label with no dropdown affordance at all.
export function HostelSelectorBar() {
  const { hostels, selectedHostel, loading, hasMultiple, setSelectedHostelId } = useHostelContext();

  if (loading || hostels.length === 0) return null;

  if (!hasMultiple) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Managing</p>
          <p className="truncate text-sm font-semibold leading-tight">{selectedHostel?.name}</p>
        </div>
      </div>
    );
  }

  return (
    <Select value={selectedHostel?.id ?? undefined} onValueChange={setSelectedHostelId}>
      <SelectTrigger className="h-auto w-full gap-2.5 rounded-lg border-transparent bg-transparent px-2 py-1.5 text-left hover:bg-accent focus:ring-0 focus:ring-offset-0 [&>svg]:shrink-0">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Managing</p>
            <SelectValue className="block truncate text-sm font-semibold leading-tight" />
          </div>
        </div>
      </SelectTrigger>
      <SelectContent>
        {hostels.map((h) => (
          <SelectItem key={h.id} value={h.id}>
            {h.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
