import { createPortal } from 'react-dom';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { cn } from '../cn';

export interface ComboboxOption {
  value: string;
  label: string;
  detail?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  value: string;
  options: readonly ComboboxOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  loading?: boolean;
  emptyMessage?: ReactNode;
  idleMessage?: ReactNode;
  onSearchChange?: (query: string) => void;
  allowCreate?: boolean;
  onCreateOption?: (value: string) => void;
  renderOption?: (option: ComboboxOption, isSelected: boolean) => ReactNode;
  containerClassName?: string;
}

/** Reference-style searchable selection with controlled selected-value semantics. */
export function Combobox({
  value,
  options,
  onChange,
  ariaLabel,
  label,
  hint,
  error,
  placeholder = 'Ketik untuk mencari...',
  disabled = false,
  clearable = true,
  loading = false,
  emptyMessage = 'Tidak ditemukan',
  idleMessage,
  onSearchChange,
  allowCreate = false,
  onCreateOption,
  renderOption,
  containerClassName,
}: ComboboxProps) {
  const inputId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<CSSProperties>({});
  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );
  const filtered = useMemo(
    () =>
      options.filter((option) =>
        `${option.label} ${option.detail ?? ''}`
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase()),
      ),
    [options, query],
  );

  const updatePosition = () => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const availableBelow = window.innerHeight - rect.bottom - 8;
    const placeAbove = availableBelow < 170 && rect.top > availableBelow;
    setPosition({
      position: 'fixed',
      zIndex: 10000,
      width: rect.width,
      left: rect.left,
      ...(placeAbove ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target) && !listRef.current?.contains(target)) {
        setOpen(false);
        setQuery('');
      }
    };
    const update = () => updatePosition();
    document.addEventListener('mousedown', closeOutside);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      document.removeEventListener('mousedown', closeOutside);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen]);

  const choose = (option: ComboboxOption) => {
    onChange(option.value);
    setOpen(false);
    setQuery('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      setQuery('');
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => {
        const count = filtered.length || 1;
        return event.key === 'ArrowDown' ? (current + 1) % count : (current - 1 + count) % count;
      });
      return;
    }
    if (event.key === 'Enter' && isOpen && filtered[activeIndex]) {
      event.preventDefault();
      choose(filtered[activeIndex]);
    }
  };

  const create = () => {
    const nextValue = query.trim();
    if (!nextValue) return;
    onCreateOption?.(nextValue);
    onChange(nextValue);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', containerClassName)}>
      {label ? (
        <label htmlFor={inputId} className="w-fit text-xs font-semibold text-[var(--color-text)]">
          {label}
        </label>
      ) : null}
      <div ref={wrapperRef} className="relative min-w-0">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
          ⌕
        </span>
        <input
          ref={inputRef}
          id={inputId}
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={`${inputId}-listbox`}
          autoComplete="off"
          disabled={disabled}
          value={isOpen ? query : (selected?.label ?? '')}
          placeholder={selected ? selected.label : placeholder}
          onFocus={() => {
            setOpen(true);
            setActiveIndex(0);
            updatePosition();
          }}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            onSearchChange?.(nextQuery);
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'h-10 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-10 text-sm text-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-muted)]/70 focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]/20 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)] disabled:opacity-50',
            error && 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20',
          )}
        />
        {clearable && selected && !disabled ? (
          <button
            type="button"
            aria-label="Clear selection"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onChange('')}
            className="absolute right-6 top-1/2 -translate-y-1/2 rounded-md px-1 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
          >
            ×
          </button>
        ) : null}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)] transition-transform',
            isOpen && 'rotate-180',
          )}
        >
          ▾
        </span>
        {isOpen
          ? createPortal(
              <div
                ref={listRef}
                id={`${inputId}-listbox`}
                role="listbox"
                style={position}
                className="max-h-60 overflow-y-auto rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl"
              >
                {!query.trim() && idleMessage ? (
                  <p className="px-3 py-4 text-center text-xs text-[var(--color-text-muted)]">
                    {idleMessage}
                  </p>
                ) : loading ? (
                  <p className="px-3 py-4 text-center text-xs text-[var(--color-text-muted)]">
                    Mencari...
                  </p>
                ) : filtered.length ? (
                  filtered.map((option, index) => {
                    const isSelected = option.value === value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={option.disabled}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => choose(option)}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-50',
                          isSelected &&
                            'bg-[var(--color-brand)]/10 font-medium text-[var(--color-brand)]',
                          index === activeIndex && 'bg-[var(--color-surface-muted)]',
                        )}
                      >
                        {renderOption ? renderOption(option, isSelected) : option.label}
                      </button>
                    );
                  })
                ) : allowCreate && query.trim() ? (
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={create}
                    className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-[var(--color-brand)] hover:bg-[var(--color-surface-muted)]"
                  >
                    Gunakan “{query.trim()}”
                  </button>
                ) : (
                  <p className="px-3 py-6 text-center text-xs text-[var(--color-text-muted)]">
                    {emptyMessage}
                  </p>
                )}
              </div>,
              document.body,
            )
          : null}
      </div>
      {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-[var(--color-text-muted)]">{hint}</p> : null}
    </div>
  );
}
