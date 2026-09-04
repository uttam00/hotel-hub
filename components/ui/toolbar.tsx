"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * The filter strip that sits above every list. Consistent placement across
 * pages (§37): search first on the left, filters after it, actions right.
 */
export function Toolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-b border-border bg-surface-sunken px-3 py-2",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Pushes everything after it to the right edge. */
export function ToolbarSpacer() {
  return <div className="ml-auto" />;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-faint"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-8 w-full pl-7 pr-7 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-faint transition-ui hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/**
 * Shows which filters are narrowing the list and offers one click to undo
 * them — the fix for "why is this list empty?", which is otherwise the most
 * common source of confusion in a filtered console.
 */
export function ActiveFilters({
  count,
  onClear,
  className,
}: {
  count: number;
  onClear: () => void;
  className?: string;
}) {
  if (count === 0) return null;
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="text-xs text-muted-foreground">
        {count} filter{count === 1 ? "" : "s"} applied
      </span>
      <Button variant="ghost" size="xs" onClick={onClear}>
        <X className="size-3" />
        Clear
      </Button>
    </div>
  );
}

/** "1–25 of 312" plus prev/next. Kept text-first so position is always known. */
export function TableFooterNav({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min(total, (page + 1) * pageSize);
  const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-sunken px-3 py-2">
      <p className="text-xs text-muted-foreground">
        {total === 0 ? (
          "No results"
        ) : (
          <>
            <span className="font-mono text-foreground">
              {start}–{end}
            </span>{" "}
            of <span className="font-mono text-foreground">{total}</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="xs"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="xs"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= lastPage}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
