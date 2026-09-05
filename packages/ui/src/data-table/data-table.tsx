import { useState, type ReactNode } from 'react';

import { cn } from '../cn';
import { Dropdown } from '../dropdown';
import { SearchInput } from '../search-input';
import { Skeleton } from '../skeleton';

export type SortDirection = 'asc' | 'desc';
export type CellTransform = 'uppercase' | 'lowercase' | 'capitalize' | 'none' | ((value: unknown) => ReactNode);

export interface TableColumn<T> {
  key: keyof T | string;
  label: ReactNode;
  render?: ((row: T, index: number) => ReactNode) | ((value: unknown, row: T, index: number) => ReactNode);
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
  type?: 'text' | 'currency' | 'number' | 'date';
  transform?: CellTransform;
  /** Legacy typo retained for oldUi compatibility. */
  trasform?: CellTransform;
}

export interface TableAction<T> {
  label: ReactNode;
  onClick: (row: T) => void;
  icon?: ReactNode;
  variant?: 'default' | 'danger';
  show?: (row: T) => boolean;
}

export interface TablePagination { page: number; pageSize: number; total: number; }

export function getPaginationPages(page: number, totalPages: number): number[] {
  const count = Math.min(Math.max(totalPages, 1), 5);
  if (totalPages <= 5) return Array.from({ length: count }, (_, index) => index + 1);
  const start = Math.min(Math.max(page - 2, 1), totalPages - 4);
  return Array.from({ length: 5 }, (_, index) => start + index);
}

export interface DataTableProps<T> {
  columns: readonly TableColumn<T>[];
  data: readonly T[];
  rowKey?: keyof T | ((row: T, index: number) => string);
  loading?: boolean;
  emptyMessage?: ReactNode;
  onRowClick?: (row: T) => void;
  sortBy?: string;
  sortDirection?: SortDirection;
  /** oldUi alias */
  sortDir?: SortDirection;
  onSort?: (key: string, direction: SortDirection) => void;
  pagination?: TablePagination;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  actions?: readonly TableAction<T>[] | ((row: T, index: number) => ReactNode);
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (query: string) => void;
  headerActions?: ReactNode;
  filters?: ReactNode;
}

function rawValue<T>(row: T, key: string): unknown {
  if (row && typeof row === 'object') return (row as Record<string, unknown>)[key];
  return undefined;
}
function toDisplay(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return '-';
}
function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}
function formatValue<T>(column: TableColumn<T>, row: T, index: number): ReactNode {
  const value = rawValue(row, String(column.key));
  if (column.render) {
    const render = column.render as (...args: unknown[]) => ReactNode;
    return render.length >= 3 ? render(value, row, index) : render(row, index);
  }
  let formatted: ReactNode;
  if (column.type === 'currency') formatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(toNumber(value));
  else if (column.type === 'number') formatted = new Intl.NumberFormat('id-ID').format(toNumber(value));
  else if (column.type === 'date') {
    const date = value instanceof Date ? value : typeof value === 'string' ? new Date(value) : null;
    formatted = date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date) : '-';
  } else formatted = toDisplay(value);
  const transform = column.transform ?? column.trasform;
  if (typeof transform === 'function') return transform(formatted);
  if (typeof formatted !== 'string') return formatted;
  if (transform === 'uppercase') return formatted.toUpperCase();
  if (transform === 'lowercase') return formatted.toLowerCase();
  if (transform === 'capitalize') return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  return formatted;
}
function alignmentClass<T>(column: TableColumn<T>) { return cn(column.align === 'center' && 'text-center', column.align === 'right' && 'text-right', (!column.align || column.align === 'left') && 'text-left'); }
function MoreIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>; }
function FilterIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><path d="M4 6h16M7 12h10M10 18h4"/></svg>; }

function PageSizeSelect({ value, onChange }: { value: number; onChange?: (value: number) => void }) {
  if (!onChange) return <span className="font-medium text-[var(--color-text)]">{value}</span>;
  return <Dropdown placement="top-start" closeOnItemClick trigger={({ open }) => <button type="button" className="relative flex h-8 items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2 pr-6 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]">{value}<span className={cn('absolute right-1.5 transition-transform', open && 'rotate-180')}>⌄</span></button>}><div className="min-w-[72px] py-1">{[10,25,50,100].map((size) => <button key={size} type="button" onClick={() => onChange(size)} className={cn('w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--color-surface-muted)]', size === value && 'bg-[var(--color-brand)]/10 font-medium text-[var(--color-brand)]')}>{size}</button>)}</div></Dropdown>;
}
function ActionMenu<T>({ actions, row }: { actions: readonly TableAction<T>[]; row: T }) {
  const visible = actions.filter((action) => !action.show || action.show(row));
  if (!visible.length) return null;
  return <Dropdown placement="bottom-end" closeOnItemClick trigger={({ open }) => <span className={cn('inline-flex size-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]', open && 'bg-[var(--color-surface-muted)] text-[var(--color-text)]')}><MoreIcon /></span>}><div className="min-w-[180px] py-1">{visible.map((action, index) => <button key={index} type="button" onClick={() => action.onClick(row)} className={cn('flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-[var(--color-surface-muted)]', action.variant === 'danger' ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]')}>{action.icon}{action.label}</button>)}</div></Dropdown>;
}

export function DataTable<T>({
  columns,
  data,
  rowKey = 'id' as keyof T,
  loading = false,
  emptyMessage = 'Tidak ada data',
  onRowClick,
  sortBy,
  sortDirection,
  sortDir,
  onSort,
  pagination,
  onPageChange,
  onPageSizeChange,
  actions,
  searchable = false,
  searchPlaceholder = 'Cari...',
  searchValue = '',
  onSearchChange,
  headerActions,
  filters,
}: DataTableProps<T>) {
  const [showFilters, setShowFilters] = useState(false);
  const direction = sortDirection ?? sortDir ?? 'asc';
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1;
  const getKey = (row: T, index: number) => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    const value = rawValue(row, String(rowKey));
    return value === null || value === undefined || value === '' ? String(index) : String(value);
  };
  const changeSort = (column: TableColumn<T>) => {
    if (!column.sortable || !onSort) return;
    onSort(String(column.key), sortBy === String(column.key) && direction === 'asc' ? 'desc' : 'asc');
  };
  const actionArray = Array.isArray(actions) ? actions : null;
  const actionRenderer = typeof actions === 'function' ? actions : null;
  const hasActions = Boolean(actionArray?.length || actionRenderer);
  const renderActions = (row: T, index: number) => actionRenderer ? actionRenderer(row, index) : actionArray ? <ActionMenu actions={actionArray} row={row} /> : null;

  return <div className="overflow-visible rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
    {(searchable || headerActions || filters) ? <div className="space-y-4 border-b border-[var(--color-border)] px-4 py-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex w-full items-center gap-2 sm:w-auto">{searchable ? <SearchInput value={searchValue} onChange={(query) => onSearchChange?.(query)} placeholder={searchPlaceholder} debounceMs={500} align="left" expandedWidth="260px"/> : null}{filters ? <button type="button" aria-label="Toggle filters" onClick={() => setShowFilters((value) => !value)} className={cn('inline-flex h-9 w-11 items-center justify-center rounded-xl border text-sm shadow-sm transition-all', showFilters ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-white' : 'border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]')}><FilterIcon /></button> : null}</div>{headerActions ? <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">{headerActions}</div> : null}</div></div> : null}
    {filters ? <div className={cn('overflow-hidden transition-all duration-300', showFilters ? 'max-h-[220px] opacity-100' : 'max-h-0 opacity-0')}><div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">{filters}</div></div> : null}

    <div className="divide-y divide-[var(--color-border)] sm:hidden">
      {loading ? Array.from({ length: 3 }, (_, index) => <div key={index} className="space-y-2 p-4"><Skeleton height={16} width="70%"/><Skeleton height={12} width="50%"/><Skeleton height={12} width="40%"/></div>) : data.length === 0 ? <div className="px-4 py-16 text-center text-sm text-[var(--color-text-muted)]">{emptyMessage}</div> : data.map((row, index) => <div key={getKey(row, index)} onClick={() => onRowClick?.(row)} className={cn('p-4', onRowClick && 'cursor-pointer active:bg-[var(--color-surface-muted)]/30')}><div className="flex items-start justify-between gap-2"><div className="min-w-0 flex-1">{columns.slice(0,2).map((column, columnIndex) => <div key={String(column.key)} className={columnIndex === 0 ? 'truncate text-sm font-medium text-[var(--color-text)]' : 'mt-0.5 truncate text-xs text-[var(--color-text-muted)]'}>{formatValue(column,row,index)}</div>)}</div>{hasActions ? <div onClick={(event) => event.stopPropagation()}>{renderActions(row,index)}</div> : null}</div>{columns.length > 2 ? <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{columns.slice(2).map((column) => <div key={String(column.key)} className="text-xs"><span className="text-[var(--color-text-muted)]">{column.label}: </span><span className="font-medium text-[var(--color-text)]">{formatValue(column,row,index)}</span></div>)}</div> : null}</div>)}
    </div>

    <div className="hidden overflow-x-auto sm:block"><table className="w-full text-sm"><thead><tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/40">{columns.map((column) => <th key={String(column.key)} style={column.width ? { width: column.width } : undefined} className={cn('whitespace-nowrap px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)]', alignmentClass(column))}><button type="button" disabled={!column.sortable} onClick={() => changeSort(column)} className={cn('inline-flex items-center gap-1', column.sortable && 'cursor-pointer hover:text-[var(--color-text)]')}>{column.label}{column.sortable && sortBy === String(column.key) ? direction === 'asc' ? '↑' : '↓' : null}</button></th>)}{hasActions ? <th className="w-16 px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)]">Aksi</th> : null}</tr></thead><tbody>
      {loading ? Array.from({ length: 5 }, (_, rowIndex) => <tr key={rowIndex} className="border-b border-[var(--color-border)]/60 last:border-0">{columns.map((column, columnIndex) => <td key={String(column.key)} className="px-4 py-3"><Skeleton height={12} width={columnIndex === 0 ? '70%' : '50%'} /></td>)}{hasActions ? <td className="px-4 py-3"><Skeleton height={24} width={24}/></td> : null}</tr>) : data.map((row, rowIndex) => <tr key={getKey(row,rowIndex)} onClick={() => onRowClick?.(row)} className={cn('border-b border-[var(--color-border)]/60 last:border-0 hover:bg-[var(--color-surface-muted)]/35', onRowClick && 'cursor-pointer')}>{columns.map((column) => <td key={String(column.key)} className={cn('px-4 py-3', alignmentClass(column))}>{formatValue(column,row,rowIndex)}</td>)}{hasActions ? <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>{renderActions(row,rowIndex)}</td> : null}</tr>)}
      {!loading && data.length === 0 ? <tr><td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-16 text-center text-sm text-[var(--color-text-muted)]">{emptyMessage}</td></tr> : null}
    </tbody></table></div>

    {pagination ? <footer className="flex flex-col items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-text-muted)] sm:flex-row"><div className="flex items-center gap-2"><span>Menampilkan</span><PageSizeSelect value={pagination.pageSize} {...(onPageSizeChange === undefined ? {} : { onChange: onPageSizeChange })}/><span>dari {pagination.total} data</span></div><div className="flex items-center gap-1"><button type="button" aria-label="Previous page" disabled={pagination.page <= 1} onClick={() => onPageChange?.(pagination.page - 1)} className="size-8 rounded-md hover:bg-[var(--color-surface-muted)] disabled:opacity-40">‹</button>{getPaginationPages(pagination.page,totalPages).map((page) => <button key={page} type="button" aria-label={`Page ${page}`} onClick={() => onPageChange?.(page)} className={cn('size-8 rounded-md', page === pagination.page ? 'bg-[var(--color-brand)] text-white' : 'hover:bg-[var(--color-surface-muted)]')}>{page}</button>)}<button type="button" aria-label="Next page" disabled={pagination.page >= totalPages} onClick={() => onPageChange?.(pagination.page + 1)} className="size-8 rounded-md hover:bg-[var(--color-surface-muted)] disabled:opacity-40">›</button></div></footer> : null}
  </div>;
}


