"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { TableSkeleton } from "./loading-skeleton";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyState,
  onRowClick,
  rowKey,
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 sm:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 font-medium text-gray-600",
                    col.hideOnMobile && "hidden md:table-cell",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "bg-white transition-colors hover:bg-gray-50",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-gray-900",
                      col.hideOnMobile && "hidden md:table-cell",
                      col.className
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 sm:hidden">
        {data.map((row) => (
          <div
            key={rowKey(row)}
            onClick={() => onRowClick?.(row)}
            className={cn(
              "rounded-xl border border-gray-200 bg-white p-4",
              onRowClick && "cursor-pointer active:bg-gray-50"
            )}
          >
            <div className="space-y-2">
              {columns.map((col) => (
                <div key={col.key} className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-gray-500">
                    {col.header}
                  </span>
                  <span className="text-sm text-gray-900">{col.render(row)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
