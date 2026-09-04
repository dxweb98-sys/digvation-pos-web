import { Check, ChevronDown, MoreHorizontal, Search, X } from 'lucide-react';
import {
  useEffect,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

type ControlSize = 'sm' | 'md';

const controlSize: Record<ControlSize, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-10 px-3 text-sm',
};

const controlBase =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-muted)]/60 focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)] disabled:opacity-50';

export interface PosInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: ControlSize;
  leftIcon?: ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

/** POS adaptation of ui-old BaseInput: a custom shell, icons, clear affordance and focus treatment. */
export function PosInput({
  size = 'md',
  leftIcon,
  clearable = false,
  onClear,
  className = '',
  value,
  disabled,
  ...props
}: PosInputProps) {
  const hasValue = value !== undefined && value !== null && value !== '';
  return (
    <div className="relative min-w-0">
      {leftIcon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
          {leftIcon}
        </span>
      ) : null}
      <input
        {...props}
        value={value}
        disabled={disabled}
        autoComplete="off"
        className={`${controlBase} ${controlSize[size]} ${leftIcon ? 'pl-9' : ''} ${clearable && hasValue ? 'pr-9' : ''} ${className}`}
      />
      {clearable && hasValue && !disabled ? (
        <button
          type="button"
          aria-label="Clear input"
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function plainNumeric(value: string) {
  if (!value) return '';
  const [whole, fraction] = value.split('.');
  const normalizedWhole = (whole || '0').replace(/^0+(?=\d)/, '');
  return fraction === undefined ? normalizedWhole : `${normalizedWhole}.${fraction}`;
}

function rupiah(raw: string) {
  const whole = currencyRaw(raw);
  if (!whole) return '';
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function currencyRaw(value: string) {
  const [whole] = value.split('.');
  return (whole ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '');
}

export function PosNumericInput({
  value,
  onChange,
  min = '0',
  max,
  integer = false,
  suffix,
  className = '',
  ...props
}: Omit<PosInputProps, 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  integer?: boolean;
  suffix?: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const display = editing ? draft : plainNumeric(value);
  const maxNumber = max === undefined ? undefined : Number(max);
  const minNumber = Number(min);
  return (
    <div className="relative">
      <PosInput
        {...props}
        value={display}
        inputMode={integer ? 'numeric' : 'decimal'}
        className={`${className} ${suffix ? 'pr-8' : ''}`}
        onFocus={(event) => {
          setDraft(value);
          setEditing(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setEditing(false);
          const parsed = Number(draft);
          if (draft && Number.isFinite(parsed)) {
            const bounded = Math.min(maxNumber ?? parsed, Math.max(minNumber, parsed));
            const normalized = integer
              ? String(Math.trunc(bounded))
              : plainNumeric(String(bounded));
            setDraft(normalized);
            onChange(normalized);
          }
          props.onBlur?.(event);
        }}
        onChange={(event) => {
          const raw = event.target.value.replace(',', '.');
          const pattern = integer ? /^\d*$/ : /^\d*(\.\d{0,4})?$/;
          if (pattern.test(raw)) {
            setDraft(raw);
            onChange(raw);
          }
        }}
      />
      {suffix ? (
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--color-text-muted)]">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

/** ui-old's currency interaction: retain an unformatted numeric value, format only for presentation. */
export function PosCurrencyInput({
  value,
  onChange,
  className = '',
  ...props
}: Omit<PosInputProps, 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => currencyRaw(value));
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 border-r border-[var(--color-border)] pr-2 text-sm font-medium text-[var(--color-text-muted)]">
        Rp
      </span>
      <PosInput
        {...props}
        value={focused ? draft : rupiah(value)}
        inputMode="numeric"
        className={`${className} pl-10 tabular-nums`}
        onFocus={(event) => {
          setDraft(currencyRaw(value));
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        onChange={(event) => {
          const raw = event.target.value.replace(/\D/g, '');
          setDraft(raw);
          onChange(raw);
        }}
      />
    </div>
  );
}

export interface PosOption {
  value: string;
  label: string;
  detail?: string;
}

export interface PosMenuItem {
  label: string;
  icon?: ReactNode;
  destructive?: boolean;
  onSelect: () => void;
}

/** Floating dropdown adaptation of ui-old BaseDropdown for compact POS actions. */
export function PosMenu({
  items,
  ariaLabel = 'Actions',
}: {
  items: readonly PosMenuItem[];
  ariaLabel?: string;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});
  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuHeight = Math.min(220, 12 + items.length * 36);
    const placeAbove = window.innerHeight - rect.bottom < menuHeight && rect.top > menuHeight;
    setPosition({
      position: 'fixed',
      zIndex: 10000,
      minWidth: 172,
      right: window.innerWidth - rect.right,
      ...(placeAbove ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
    });
  }, [items.length]);
  useEffect(() => {
    if (!open) return;
    updatePosition();
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target))
        setOpen(false);
    };
    const closeEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const update = () => updatePosition();
    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      document.removeEventListener('mousedown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, updatePosition]);
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
          requestAnimationFrame(updatePosition);
        }}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[11px] font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={position}
              className="pos-control-popover overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl"
            >
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium transition-colors ${item.destructive ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10' : 'text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]'}`}
                >
                  {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
                  {item.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function PosAutocomplete({
  value,
  options,
  onChange,
  placeholder = 'Pilih...',
  disabled = false,
  error,
  loading = false,
  emptyMessage = 'Tidak ditemukan',
  idleMessage,
  onSearchChange,
  ariaLabel,
}: {
  value: string;
  options: readonly PosOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  idleMessage?: string;
  onSearchChange?: (query: string) => void;
  ariaLabel: string;
}) {
  const inputId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<CSSProperties>({});
  const filtered = useMemo(
    () =>
      options.filter((option) =>
        `${option.label} ${option.detail ?? ''}`.toLowerCase().includes(query.toLowerCase()),
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
    if (!open) return;
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
  }, [open]);
  const choose = (option: PosOption) => {
    onChange(option.value);
    setOpen(false);
    setQuery('');
    inputRef.current?.focus();
  };
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      setQuery('');
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => {
        const size = filtered.length || 1;
        return event.key === 'ArrowDown' ? (current + 1) % size : (current - 1 + size) % size;
      });
      return;
    }
    if (event.key === 'Enter' && open && filtered[activeIndex]) {
      event.preventDefault();
      choose(filtered[activeIndex]);
    }
  };
  return (
    <div ref={wrapperRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
      <input
        ref={inputRef}
        id={inputId}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${inputId}-listbox`}
        autoComplete="off"
        disabled={disabled}
        value={open ? query : (selected?.label ?? '')}
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
        className={`${controlBase} ${controlSize.sm} ${error ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20' : ''} pl-9 pr-9`}
      />
      {selected && !disabled ? (
        <button
          type="button"
          aria-label="Clear selection"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onChange('')}
          className="absolute right-6 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
      <ChevronDown
        className={`pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-[var(--color-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
      />
      {open
        ? createPortal(
            <div
              ref={listRef}
              id={`${inputId}-listbox`}
              role="listbox"
              style={position}
              className="pos-control-popover max-h-60 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl"
            >
              {!query.trim() && idleMessage ? (
                <p className="px-3 py-4 text-center text-xs text-[var(--color-text-muted)]">
                  {idleMessage}
                </p>
              ) : loading ? (
                <p className="px-3 py-4 text-center text-xs text-[var(--color-text-muted)]">
                  Mencari pelanggan…
                </p>
              ) : filtered.length ? (
                filtered.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(option)}
                    className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--color-surface-muted)] ${option.value === value ? 'bg-[var(--color-brand)]/10 font-semibold text-[var(--color-brand)]' : ''} ${index === activeIndex ? 'bg-[var(--color-surface-muted)]' : ''}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{option.label}</span>
                      {option.detail ? (
                        <span className="mt-0.5 block truncate text-[10px] font-normal text-[var(--color-text-muted)]">
                          {option.detail}
                        </span>
                      ) : null}
                    </span>
                    {option.value === value ? <Check className="size-3.5 shrink-0" /> : null}
                  </button>
                ))
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
  );
}
