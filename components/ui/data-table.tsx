"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Inbox, SlidersHorizontal } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScroller,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ActiveFilters,
  SearchInput,
  TableFooterNav,
  Toolbar,
} from "@/components/ui/toolbar";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Column id to filter with the toolbar's search box. */
  searchKey?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  /** Extra filter controls, rendered in the toolbar after the search box. */
  filters?: React.ReactNode;
  /** Buttons pinned to the right of the toolbar. */
  actions?: React.ReactNode;
  /**
   * Renders a bulk action bar when rows are selected. Receives the selected
   * rows and a callback to clear the selection after acting.
   */
  bulkActions?: (rows: TData[], clear: () => void) => React.ReactNode;
  /** Adds a leading selection checkbox column. */
  selectable?: boolean;
  onRowClick?: (row: TData) => void;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ComponentType<{ className?: string }>;
  /** Caps the scroll region so the header and toolbar stay put. */
  maxHeight?: string;
  className?: string;
}

/**
 * The console's list surface (§18).
 *
 * Sticky header, compact rows, sortable columns, bulk selection with a
 * contextual action bar, column visibility, and pagination that always states
 * where you are. Rows are clickable when `onRowClick` is supplied, with proper
 * keyboard support — a row you can click with a mouse but not with Enter is an
 * accessibility failure, and this table is used all day.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search…",
  loading = false,
  filters,
  actions,
  bulkActions,
  selectable = false,
  onRowClick,
  pageSize = 25,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Records will appear here once they exist.",
  emptyIcon = Inbox,
  maxHeight,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const allColumns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!selectable) return columns;
    const selectColumn: ColumnDef<TData, TValue> = {
      id: "__select",
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all rows on this page"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
          // Stops a selection click from also triggering onRowClick.
          onClick={(e) => e.stopPropagation()}
        />
      ),
    };
    return [selectColumn, ...columns];
  }, [columns, selectable]);

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: { pagination: { pageSize } },
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  const searchValue =
    (searchKey && (table.getColumn(searchKey)?.getFilterValue() as string)) || "";
  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const clearSelection = React.useCallback(() => setRowSelection({}), []);
  const hideableColumns = table.getAllColumns().filter((c) => c.getCanHide());
  const rows = table.getRowModel().rows;

  return (
    <div className={cn("overflow-hidden rounded-md border border-border bg-card", className)}>
      {(searchKey || filters || actions || hideableColumns.length > 0) && (
        <Toolbar>
          {searchKey && (
            <SearchInput
              value={searchValue}
              onChange={(v) => table.getColumn(searchKey)?.setFilterValue(v)}
              placeholder={searchPlaceholder}
              className="w-full sm:w-56"
            />
          )}
          {filters}
          <ActiveFilters
            count={columnFilters.filter((f) => f.id !== searchKey).length}
            onClear={() => setColumnFilters([])}
          />
          <div className="ml-auto flex items-center gap-1.5">
            {actions}
            {hideableColumns.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="xs">
                    <SlidersHorizontal className="size-3.5" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {hideableColumns.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(v) => column.toggleVisibility(!!v)}
                    >
                      {/* Prefer a human header over the raw column id. */}
                      {typeof column.columnDef.header === "string"
                        ? column.columnDef.header
                        : column.id.replace(/_/g, " ")}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </Toolbar>
      )}

      {bulkActions && selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-primary-border bg-primary-subtle px-3 py-2">
          <span className="text-sm font-medium text-primary">
            {selectedRows.length} selected
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            {bulkActions(selectedRows, clearSelection)}
            <Button variant="ghost" size="xs" onClick={clearSelection}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={8} columns={Math.min(6, allColumns.length)} />
      ) : rows.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      ) : (
        <TableScroller maxHeight={maxHeight}>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    const content = header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext());

                    return (
                      <TableHead
                        key={header.id}
                        style={{
                          width: header.getSize() === 150 ? undefined : header.getSize(),
                        }}
                        aria-sort={
                          sorted === "asc"
                            ? "ascending"
                            : sorted === "desc"
                            ? "descending"
                            : undefined
                        }
                      >
                        {canSort ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="-mx-1 inline-flex items-center gap-1 rounded-sm px-1 py-0.5 uppercase transition-ui hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {content}
                            {sorted === "asc" ? (
                              <ArrowUp className="size-3 text-primary" />
                            ) : sorted === "desc" ? (
                              <ArrowDown className="size-3 text-primary" />
                            ) : (
                              <ChevronsUpDown className="size-3 text-faint" />
                            )}
                          </button>
                        ) : (
                          content
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  // A clickable row must also be reachable and activatable from
                  // the keyboard, not just the mouse.
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? "button" : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(row.original);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    onRowClick &&
                      "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableScroller>
      )}

      {!loading && rows.length > 0 && (
        <TableFooterNav
          page={table.getState().pagination.pageIndex}
          pageSize={table.getState().pagination.pageSize}
          total={table.getFilteredRowModel().rows.length}
          onPageChange={(p) => table.setPageIndex(p)}
        />
      )}
    </div>
  );
}
