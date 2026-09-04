import { type ReactNode } from 'react';

import { cn } from '../cn';
import { Skeleton } from '../skeleton';

export type SortDirection = 'asc' | 'desc';

export interface TableColumn<T> {
  key: string;
  label: ReactNode;
  render: (row: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
}

export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
}

export function getPaginationPages(page: number, totalPages: number): number[] {
  const count = Math.min(Math.max(totalPages, 1), 5);
  if (totalPages <= 5)
    return Array.from({ length: count }, (value, index) => {
      void value;
      return index + 1;
    });
  const start = Math.min(Math.max(page - 2, 1), totalPages - 4);
  return Array.from({ length: 5 }, (value, index) => {
    void value;
    return start + index;
  });
}

export interface DataTableProps<T> {
  columns: readonly TableColumn<T>[];
  data: readonly T[];
  rowKey: (row: T, index: number) => string;
  loading?: boolean;
  emptyMessage?: ReactNode;
  onRowClick?: (row: T) => void;
  sortBy?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string, direction: SortDirection) => void;
  pagination?: TablePagination;
  onPageChange?: (page: number) => void;
  actions?: (row: T, index: number) => ReactNode;
}

/** Generic presentation table. Data fetching, filters, money formatting and domain actions stay in features. */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyMessage = 'Tidak ada data',
  onRowClick,
  sortBy,
  sortDirection = 'asc',
  onSort,
  pagination,
  onPageChange,
  actions,
}: DataTableProps<T>) {
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 1;
  const changeSort = (column: TableColumn<T>) => {
    if (!column.sortable || !onSort) return;
    onSort(column.key, sortBy === column.key && sortDirection === 'asc' ? 'desc' : 'asc');
  };
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/45">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)]',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                  )}
                >
                  <button
                    type="button"
                    disabled={!column.sortable}
                    onClick={() => changeSort(column)}
                    className={cn(
                      'inline-flex items-center gap-1',
                      column.sortable && 'cursor-pointer hover:text-[var(--color-text)]',
                    )}
                  >
                    {column.label}
                    {column.sortable && sortBy === column.key
                      ? sortDirection === 'asc'
                        ? '↑'
                        : '↓'
                      : null}
                  </button>
                </th>
              ))}
              {actions ? <th className="w-16 px-4 py-3" /> : null}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }, (value, rowIndex) => {
                  void value;
                  return (
                    <tr
                      key={rowIndex}
                      className="border-b border-[var(--color-border)]/60 last:border-0"
                    >
                      {columns.map((column, columnIndex) => (
                        <td key={column.key} className="px-4 py-3">
                          <Skeleton className={columnIndex === 0 ? 'h-3 w-3/4' : 'h-3 w-1/2'} />
                        </td>
                      ))}
                      {actions ? (
                        <td className="px-4 py-3">
                          <Skeleton className="ml-auto h-6 w-6" />
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              : data.map((row, rowIndex) => (
                  <tr
                    key={rowKey(row, rowIndex)}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'border-b border-[var(--color-border)]/60 last:border-0 hover:bg-[var(--color-surface-muted)]/35',
                      onRowClick && 'cursor-pointer',
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-4 py-3',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right',
                        )}
                      >
                        {column.render(row, rowIndex)}
                      </td>
                    ))}
                    {actions ? (
                      <td className="px-4 py-3 text-right">{actions(row, rowIndex)}</td>
                    ) : null}
                  </tr>
                ))}
            {!loading && data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-16 text-center text-sm text-[var(--color-text-muted)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {pagination ? (
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-text-muted)]">
          <span>
            Menampilkan {data.length} dari {pagination.total} data
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous page"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
              className="size-8 rounded-md hover:bg-[var(--color-surface-muted)] disabled:opacity-40"
            >
              ‹
            </button>
            {getPaginationPages(pagination.page, totalPages).map((page) => (
              <button
                key={page}
                type="button"
                aria-label={`Page ${page}`}
                onClick={() => onPageChange?.(page)}
                className={cn(
                  'size-8 rounded-md',
                  page === pagination.page
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'hover:bg-[var(--color-surface-muted)]',
                )}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              aria-label="Next page"
              disabled={pagination.page >= totalPages}
              onClick={() => onPageChange?.(pagination.page + 1)}
              className="size-8 rounded-md hover:bg-[var(--color-surface-muted)] disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
