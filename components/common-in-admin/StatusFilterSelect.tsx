"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FilterOption = { value: string; label: string };

// Reused "All / X / Y / Z" filter dropdown above every hostel-admin table —
// a thin wrapper so the same filter UI/behavior doesn't get re-implemented
// per page. `value === "ALL"` means no filtering.
export function StatusFilterSelect({
  value,
  onChange,
  options,
  label = "Status",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  label?: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-[180px]"}>
        <SelectValue placeholder={`Filter by ${label.toLowerCase()}`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All {label}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
