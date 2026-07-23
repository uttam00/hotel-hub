import type { ComponentType, ReactNode } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { TableLoader } from "@/components/ui/loader";
import { EmptyState } from "@/components/ui/empty-state";

interface TableRowsProps<T> {
  loading: boolean;
  items: T[];
  colSpan: number;
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon?: ComponentType<{ className?: string }>;
  children: (item: T) => ReactNode;
}

// Collapses the loading / empty / list ternary repeated across admin tables.
// Drop directly inside <TableBody>.
export function TableRows<T>({
  loading,
  items,
  colSpan,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  children,
}: TableRowsProps<T>) {
  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan}>
          <TableLoader />
        </TableCell>
      </TableRow>
    );
  }

  if (items.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan}>
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
        </TableCell>
      </TableRow>
    );
  }

  return <>{items.map(children)}</>;
}
