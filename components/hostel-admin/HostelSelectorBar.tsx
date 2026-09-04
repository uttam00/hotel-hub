"use client";

import { Building2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHostelContext } from "@/contexts/hostel-context";

/**
 * The property switcher, pinned under the logo in the sidebar.
 *
 * Styled for the dark sidebar rather than the light content area. When the
 * admin manages exactly one hostel there is nothing to choose, so it renders as
 * a plain label with no dropdown affordance — an inert control that looks
 * interactive is worse than no control.
 */
export function HostelSelectorBar() {
  const { hostels, selectedHostel, loading, hasMultiple, setSelectedHostelId } =
    useHostelContext();

  if (loading || hostels.length === 0) return null;

  if (!hasMultiple) {
    return (
      <div className="flex items-center gap-2 rounded-sm px-2 py-1.5">
        <Building2 className="size-4 shrink-0 text-sidebar-primary" />
        <div className="min-w-0">
          <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-sidebar-heading">
            Property
          </p>
          <p className="truncate text-sm font-medium leading-tight text-sidebar-accent-foreground">
            {selectedHostel?.name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Select value={selectedHostel?.id ?? undefined} onValueChange={setSelectedHostelId}>
      <SelectTrigger
        aria-label="Switch property"
        className="h-auto w-full gap-2 border-sidebar-border bg-sidebar-accent/60 px-2 py-1.5 text-left text-sidebar-accent-foreground hover:bg-sidebar-accent focus:border-sidebar-ring focus:ring-sidebar-ring/30 [&>svg]:text-sidebar-foreground"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Building2 className="size-4 shrink-0 text-sidebar-primary" />
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-sidebar-heading">
              Property
            </p>
            <SelectValue className="block truncate text-sm font-medium leading-tight" />
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
