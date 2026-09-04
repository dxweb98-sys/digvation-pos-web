import { useId, useMemo, useRef, useState, type ReactNode } from 'react';

import { cn } from '../cn';
import { Dropdown } from '../dropdown';
import type { SelectOption } from '../select';

function ClearIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5"><path d="m18 6-12 12M6 6l12 12" /></svg>;
}
function ChevronIcon({ open }: { open: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn('size-3.5 transition-transform', open && 'rotate-180')}><path d="m6 9 6 6 6-6" /></svg>;
}

export interface SelectFilterProps {
  label?: ReactNode;
  placeholder?: ReactNode;
  options: readonly SelectOption[];
  value?: string | number | null;
  onChange?: (value: string | number | null) => void;
  error?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  containerClassName?: string;
}

/** Filter-specific Select from oldUi: label lives inside the trigger, not above it. */
export function SelectFilter({
  label,
  placeholder = 'Pilih...',
  options,
  value,
  onChange,
  error,
  hint,
  disabled = false,
  clearable = true,
  searchable = false,
  containerClassName,
}: SelectFilterProps) {
  const id = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const selectedOption = options.find((option) => String(option.value) === String(value ?? ''));
  const filtered = useMemo(() => {
    if (!searchable || !search) return options;
    const query = search.toLocaleLowerCase();
    return options.filter((option) => String(option.label).toLocaleLowerCase().includes(query));
  }, [options, search, searchable]);

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', containerClassName)}>
      <Dropdown
        matchWidth
        onOpenChange={(open) => {
          if (open && searchable) requestAnimationFrame(() => searchRef.current?.focus());
          if (!open) setSearch('');
        }}
        trigger={({ open }) => (
          <div
            className={cn(
              'relative flex h-10 w-full items-center rounded-lg border bg-[var(--color-surface)] px-3 pr-8 text-left text-sm transition-colors focus-within:border-[var(--color-brand)] focus-within:ring-2 focus-within:ring-[var(--color-brand)]/20',
              error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]',
              disabled && 'cursor-not-allowed bg-[var(--color-surface-muted)] opacity-50',
            )}
          >
            {label ? (
              <div className="flex shrink-0 items-center gap-2 text-[var(--color-text-muted)]">
                <label htmlFor={id} className="text-sm font-medium">{label}</label>
                <span aria-hidden="true" className="opacity-45">|</span>
              </div>
            ) : null}
            <button
              id={id}
              type="button"
              disabled={disabled}
              className={cn(
                'min-w-0 flex-1 truncate pl-3 pr-6 text-left outline-none',
                selectedOption ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]/60',
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </button>
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[var(--color-text-muted)]">
              {clearable && selectedOption && !disabled ? (
                <button
                  type="button"
                  aria-label="Clear filter"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => {
                    event.stopPropagation();
                    onChange?.(null);
                  }}
                  className="rounded-md p-0.5 hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                >
                  <ClearIcon />
                </button>
              ) : null}
              <ChevronIcon open={open} />
            </div>
          </div>
        )}
      >
        <div className="max-h-60 overflow-hidden">
          {searchable ? (
            <div className="border-b border-[var(--color-border)] p-2">
              <input
                ref={searchRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari..."
                className="h-8 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
              />
            </div>
          ) : null}
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  if (option.disabled) return;
                  onChange?.(option.value);
                  setSearch('');
                }}
                className={cn(
                  'w-full rounded-md px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-50',
                  String(option.value) === String(value ?? '') && 'bg-[var(--color-brand)]/10 font-medium text-[var(--color-brand)]',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </Dropdown>
      {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-[var(--color-text-muted)]">{hint}</p> : null}
    </div>
  );
}
