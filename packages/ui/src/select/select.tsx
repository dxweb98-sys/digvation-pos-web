import {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';

import { cn } from '../cn';
import { Dropdown } from '../dropdown';
import { INPUT_SIZE_STYLES, type InputSize } from '../shared';

export interface SelectOption {
  value: string | number;
  label: ReactNode;
  disabled?: boolean;
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn('size-3.5 transition-transform', open && 'rotate-180')} aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;
}
function ClearIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5"><path d="m18 6-12 12M6 6l12 12" /></svg>;
}

export function selectOptionsFromChildren(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>(child)) return [];
    if (child.type !== 'option' || child.props.value === undefined) return [];
    return [{ value: child.props.value, label: child.props.children, ...(child.props.disabled === undefined ? {} : { disabled: child.props.disabled }) }];
  });
}

function sameValue(left: string | number | null | undefined, right: string | number | null | undefined) {
  return String(left ?? '') === String(right ?? '');
}

export interface SelectProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onChange' | 'value' | 'defaultValue'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
  options?: readonly SelectOption[];
  children?: ReactNode;
  placeholder?: ReactNode;
  clearable?: boolean;
  searchable?: boolean;
  loading?: boolean;
  emptyMessage?: ReactNode;
  fetchOptions?: (search: string) => Promise<readonly SelectOption[]>;
  value?: string | number | null;
  defaultValue?: string | number | null;
  size?: InputSize;
  debounceMs?: number;
  onValueChange?: (value: string | number | null) => void;
  onChange?: (value: string | number | null) => void;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    className,
    children,
    label,
    hint,
    error,
    containerClassName,
    id: providedId,
    options,
    placeholder = 'Pilih...',
    clearable = true,
    searchable = false,
    loading = false,
    emptyMessage = 'Tidak ditemukan',
    fetchOptions,
    onValueChange,
    onChange,
    value,
    defaultValue = null,
    disabled = false,
    size = 'md',
    debounceMs = 300,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const s = INPUT_SIZE_STYLES[size];
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string | number | null>(defaultValue);
  const [resolvedAsyncSelection, setResolvedAsyncSelection] = useState<SelectOption | null>(null);
  const [asyncOptions, setAsyncOptions] = useState<readonly SelectOption[]>([]);
  const [isFetching, setFetching] = useState(false);
  const selectedValue = value === undefined ? internalValue : value;
  const staticOptions = useMemo(() => options?.slice() ?? selectOptionsFromChildren(children), [children, options]);
  const isAsync = Boolean(fetchOptions);
  const sourceOptions = isAsync ? asyncOptions : staticOptions;
  const filteredOptions = useMemo(
    () => !isAsync && searchable && query
      ? sourceOptions.filter((option) => String(option.label).toLocaleLowerCase().includes(query.toLocaleLowerCase()))
      : sourceOptions,
    [isAsync, query, searchable, sourceOptions],
  );
  const selected = staticOptions.find((option) => sameValue(option.value, selectedValue)) ?? (sameValue(resolvedAsyncSelection?.value, selectedValue) ? resolvedAsyncSelection : null);

  useEffect(() => {
    if (!isAsync || !fetchOptions || !isOpen) return;
    let active = true;
    const timeout = window.setTimeout(() => {
      setFetching(true);
      void fetchOptions(query).then((result) => {
        if (active) setAsyncOptions(result);
      }).finally(() => {
        if (active) setFetching(false);
      });
    }, debounceMs);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [debounceMs, fetchOptions, isAsync, isOpen, query]);

  useEffect(() => {
    if (!isAsync || !fetchOptions || selectedValue == null || selectedValue === '' || resolvedAsyncSelection) return;
    let active = true;
    void fetchOptions('').then((result) => {
      const found = result.find((option) => sameValue(option.value, selectedValue));
      if (active && found) setResolvedAsyncSelection(found);
    });
    return () => { active = false; };
  }, [fetchOptions, isAsync, resolvedAsyncSelection, selectedValue]);

  const choose = (option: SelectOption) => {
    if (value === undefined) setInternalValue(option.value);
    setResolvedAsyncSelection(option);
    onValueChange?.(option.value);
    onChange?.(option.value);
    setOpen(false);
    setQuery('');
  };

  const clear = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (value === undefined) setInternalValue(null);
    setResolvedAsyncSelection(null);
    onValueChange?.(null);
    onChange?.(null);
    setQuery('');
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      setQuery('');
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => {
        const count = filteredOptions.length || 1;
        return event.key === 'ArrowDown' ? (index + 1) % count : (index - 1 + count) % count;
      });
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const active = filteredOptions[activeIndex];
      if (isOpen && active && !active.disabled) choose(active);
      else setOpen(true);
    }
  };

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', containerClassName)}>
      {label ? <label htmlFor={id} className={cn(s.label, 'inline-block w-fit font-medium text-[var(--color-text)]')}>{label}</label> : null}
      <Dropdown
        matchWidth
        open={isOpen}
        onOpenChange={setOpen}
        contentRole="listbox"
        onClose={() => { setOpen(false); setQuery(''); }}
        trigger={({ open }) => (
          <div className="relative">
            <button
              {...props}
              ref={ref}
              id={id}
              type="button"
              disabled={disabled}
              aria-invalid={Boolean(error) || undefined}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls={`${id}-listbox`}
              onKeyDown={handleTriggerKeyDown}
              className={cn(
                'flex w-full items-center rounded-lg border bg-[var(--color-surface)] text-left transition-colors duration-150 focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)] disabled:opacity-50',
                s.input,
                error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]',
                selected ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]/60',
                'pr-10',
                className,
              )}
            >
              <span className="min-w-0 flex-1 truncate">{selected ? selected.label : placeholder}</span>
            </button>
            <div className={cn('absolute top-1/2 flex -translate-y-1/2 items-center gap-1 text-[var(--color-text-muted)]', size === 'sm' ? 'right-1.5' : 'right-2')}>
              {clearable && selected && !disabled ? <button type="button" tabIndex={-1} aria-label="Clear selection" onMouseDown={(event) => event.preventDefault()} onClick={clear} className="rounded-md p-0.5 hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"><ClearIcon /></button> : null}
              {!disabled ? <ChevronDownIcon open={open} /> : null}
            </div>
          </div>
        )}
      >
        <div id={`${id}-listbox`} className="max-h-60 overflow-hidden">
          {searchable ? <div className="border-b border-[var(--color-border)] p-2"><input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} placeholder="Cari..." className="h-8 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 text-xs text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20" /></div> : null}
          <div className="max-h-48 overflow-y-auto p-1">
            {loading || isFetching ? <p className="px-3 py-2 text-sm text-[var(--color-text-muted)]">Loading...</p> : filteredOptions.length === 0 ? <p className="px-3 py-2 text-sm text-[var(--color-text-muted)]">{emptyMessage}</p> : filteredOptions.map((option, index) => (
              <button key={String(option.value)} type="button" role="option" aria-selected={sameValue(option.value, selectedValue)} disabled={option.disabled} onMouseDown={(event) => event.preventDefault()} onClick={(event) => { event.stopPropagation(); if (!option.disabled) choose(option); }} className={cn('w-full rounded-md px-3 py-2 text-left text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-50', sameValue(option.value, selectedValue) && 'bg-[var(--color-brand)]/10 font-medium text-[var(--color-brand)]', index === activeIndex && !sameValue(option.value, selectedValue) && 'bg-[var(--color-surface-muted)]')}>{option.label}</button>
            ))}
          </div>
        </div>
      </Dropdown>
      {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-[var(--color-text-muted)]">{hint}</p> : null}
    </div>
  );
});

