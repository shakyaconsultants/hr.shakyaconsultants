import { cn } from '@/shared/utils/cn';
import * as React from 'react';
import { EmptyState } from '@/shared/components/empty-state';
import { TableSkeleton } from '@/shared/components/table-skeleton';
import { Button } from '@/shared/components/ui/button';

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return String(value);
}

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

export interface DataTablePagination {
  page: number;
  totalPages: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyTitle?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  pagination?: DataTablePagination;
  stickyHeader?: boolean;
  skeletonRows?: number;
  getRowId?: (row: T) => string;
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No records found',
  emptyTitle,
  emptyAction,
  onRowClick,
  pagination,
  stickyHeader = true,
  skeletonRows = 5,
  getRowId,
}: DataTableProps<T>) {
  const safeData = data ?? [];
  const safeColumns = columns ?? [];

  if (isLoading) {
    return <TableSkeleton rows={skeletonRows} columns={Math.max(safeColumns.length, 4)} />;
  }

  if (safeData.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? emptyMessage}
        description={emptyTitle ? emptyMessage : undefined}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[640px] text-sm text-foreground">
          <thead className={cn('border-b bg-muted/50 text-muted-foreground', stickyHeader && 'sticky top-0 z-10')}>
            <tr>
              {safeColumns.map((column) => (
                <th key={column.key} className={cn('px-4 py-3 text-left font-medium', column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safeData.map((row, index) => {
              const rowId = getRowId?.(row) ?? row.id ?? String(index);
              return (
                <tr
                  key={rowId}
                  className={cn('border-b last:border-0', onRowClick && 'cursor-pointer hover:bg-muted/30')}
                  onClick={() => onRowClick?.(row)}
                >
                  {safeColumns.map((column) => (
                    <td key={column.key} className={cn('px-4 py-3 text-foreground', column.className)}>
                      {column.render
                        ? column.render(row)
                        : formatCellValue((row as Record<string, unknown>)[column.key])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
