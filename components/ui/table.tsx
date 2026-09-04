import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Enterprise table primitives.
 *
 * Density is the point: a warden scanning 300 residents should see as many as
 * possible without the rows becoming unreadable. Rows are 8px vertical padding
 * (vs the old 16px), separated by hairlines rather than by whitespace.
 *
 * Wrap in <TableScroller> to get a sticky header inside a height-capped,
 * horizontally scrollable region.
 */

/**
 * Height-capped scroll region with a sticky header. `maxHeight` is passed
 * through so a page can cap the table to the viewport and keep the header and
 * toolbar fixed while the body scrolls.
 */
const TableScroller = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { maxHeight?: string }
>(({ className, maxHeight, style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative w-full overflow-auto", className)}
    style={{ maxHeight, ...style }}
    {...props}
  />
));
TableScroller.displayName = "TableScroller";

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <table
    ref={ref}
    className={cn(
      "w-full caption-bottom border-separate border-spacing-0 text-sm",
      className
    )}
    {...props}
  />
));
Table.displayName = "Table";

/**
 * Sticky by default. `border-separate` above plus a bottom border on the cells
 * (rather than on the row) is what keeps the header rule visible while
 * scrolling — a border on a sticky <tr> is painted away by the scrolling body.
 */
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "sticky top-0 z-10 bg-surface-sunken [&_th]:border-b [&_th]:border-border-strong",
      className
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child_td]:border-b-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "bg-surface-sunken font-medium [&_td]:border-t [&_td]:border-border-strong",
      className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "group/row transition-ui hover:bg-muted/60 data-[state=selected]:bg-primary-subtle",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    /** Right-aligns the column — use for every currency and count column. */
    numeric?: boolean;
  }
>(({ className, numeric, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-8 whitespace-nowrap px-3 text-left align-middle text-2xs font-semibold uppercase tracking-[0.06em] text-muted-foreground",
      "[&:has([role=checkbox])]:w-9 [&:has([role=checkbox])]:pr-0",
      numeric && "text-right",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    /** Right-aligns and sets mono figures so digits line up down the column. */
    numeric?: boolean;
  }
>(({ className, numeric, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "border-b border-border px-3 py-2 align-middle",
      "[&:has([role=checkbox])]:pr-0",
      numeric && "text-right font-mono text-sm",
      className
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-3 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableScroller,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
