import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '../cn';
import { INPUT_SIZE_STYLES, type InputSize } from '../shared';

export type InputFormat = 'plain' | 'currency' | 'percentage';
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';

function ClearIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="m18 6-12 12M6 6l12 12" /></svg>;
}
function EyeIcon({ closed, className }: { closed?: boolean; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>{closed ? <path d="m3 3 18 18" /> : null}<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5" /></svg>;
}
function InfoIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></svg>;
}

function formatLegacyCurrency(value: string | number): string {
  const raw = String(value).replace(/\D/g, '');
  if (!raw || Number(raw) === 0) return '';
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function eventWithValue(value: string): ChangeEvent<HTMLInputElement> {
  return { target: { value }, currentTarget: { value } } as ChangeEvent<HTMLInputElement>;
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'size' | 'prefix'> {
  label?: ReactNode;
  labelInfo?: ReactNode;
  error?: ReactNode;
  hint?: ReactNode;
  type?: InputType;
  clearable?: boolean;
  size?: InputSize;
  onClear?: () => void;
  onChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  onNativeChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftAdornment?: ReactNode;
  rightAdornment?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  format?: InputFormat;
  loading?: boolean;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    labelInfo,
    error,
    hint,
    type = 'text',
    clearable = true,
    size = 'md',
    onClear,
    onChange,
    onNativeChange,
    leftIcon,
    rightIcon,
    leftAdornment,
    rightAdornment,
    prefix,
    suffix,
    format = 'plain',
    loading = false,
    containerClassName,
    className,
    value,
    disabled,
    readOnly,
    id: externalId,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const id = externalId ?? autoId;
  const [showPassword, setShowPassword] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const s = INPUT_SIZE_STYLES[size];

  const inputType = type === 'password' && showPassword ? 'text' : type === 'number' ? 'text' : type;
  const isZero = (type === 'number' || format === 'currency') && value !== '' && value != null && Number(value) === 0;
  const hasValue = value !== undefined && value !== null && value !== '' && !isZero;
  const showClear = clearable && hasValue && !disabled && !readOnly && !loading;
  const leadingIcon = leftAdornment ?? leftIcon;
  const trailingIcon = rightAdornment ?? rightIcon;
  const resolvedPrefix = prefix ?? (format === 'currency' ? 'Rp' : undefined);
  const resolvedSuffix = suffix ?? (format === 'percentage' ? '%' : undefined);
  const hasLeading = Boolean(leadingIcon || resolvedPrefix);
  const hasTrailing = Boolean(trailingIcon || resolvedSuffix || showClear || type === 'password' || loading);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!tooltipRef.current?.contains(event.target as Node)) setShowTooltip(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = (): string => {
    if (value === undefined || value === null) return '';
    if (type === 'number' && (value === 0 || value === '0')) return '';
    if (format === 'currency') return formatLegacyCurrency(value as string | number);
    return String(value);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    let next = event.target.value;
    if (format === 'currency') next = next.replace(/\D/g, '');
    else if (format !== 'plain') next = next.replace(/[^0-9.,-]/g, '');
    onChange?.(next, event);
    onNativeChange?.(event);
  };

  const handleClear = () => {
    const event = eventWithValue('');
    onClear?.();
    onChange?.('', event);
    onNativeChange?.(event);
  };

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', containerClassName)}>
      {label ? (
        <div className="flex w-fit items-center gap-1.5">
          <label htmlFor={id} className={cn(s.label, 'font-medium text-[var(--color-text)]')}>{label}</label>
          {labelInfo ? (
            <div ref={tooltipRef} className="group relative flex items-center">
              <button type="button" aria-label="Field information" aria-expanded={showTooltip} onClick={() => setShowTooltip((v) => !v)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                <InfoIcon className="size-3.5" />
              </button>
              <div role="tooltip" className={cn('invisible absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[220px] -translate-x-1/2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100', showTooltip && 'visible opacity-100')}>
                <div className="relative rounded-lg bg-[#1f2a44] px-3 py-2 text-xs text-white shadow-lg">{labelInfo}<div className="absolute left-1/2 top-full size-0 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-[#1f2a44]" /></div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="relative flex min-w-0 items-center">
        {leadingIcon ? <span className={cn('pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-[var(--color-text-muted)]', size === 'sm' ? 'left-2.5 [&_svg]:size-3.5' : 'left-3 [&_svg]:size-4')}>{leadingIcon}</span> : null}
        {resolvedPrefix ? <span className={cn('pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 font-medium text-[var(--color-text-muted)]', size === 'sm' ? 'text-xs' : 'text-sm')}>{resolvedPrefix}</span> : null}
        <input
          {...props}
          ref={ref}
          id={id}
          autoComplete={props.autoComplete ?? 'off'}
          type={inputType}
          inputMode={props.inputMode ?? (type === 'number' || format !== 'plain' ? 'numeric' : undefined)}
          value={displayValue()}
          onChange={handleChange}
          disabled={disabled || loading}
          readOnly={readOnly}
          aria-invalid={Boolean(error) || undefined}
          aria-busy={loading || undefined}
          className={cn(
            'w-full min-w-0 rounded-lg border bg-[var(--color-surface)] text-[var(--color-text)] transition-colors duration-150 placeholder:text-[var(--color-text-muted)]/60 focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)] disabled:opacity-50 read-only:bg-[var(--color-surface-muted)]',
            s.input,
            error ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20' : 'border-[var(--color-border)]',
            hasLeading && (size === 'sm' ? 'pl-8' : 'pl-10'),
            hasTrailing && (size === 'sm' ? 'pr-8' : 'pr-10'),
            className,
          )}
        />
        {resolvedSuffix ? <span className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 font-medium text-[var(--color-text-muted)]', size === 'sm' ? 'right-2.5 text-xs' : 'right-3 text-sm')}>{resolvedSuffix}</span> : null}
        {(showClear || type === 'password' || trailingIcon || loading) ? (
          <div className={cn('absolute top-1/2 flex -translate-y-1/2 items-center text-[var(--color-text-muted)]', size === 'sm' ? 'right-1.5 gap-0.5' : 'right-2 gap-1', resolvedSuffix && 'pointer-events-none opacity-0')}>
            {loading ? <span aria-label="Loading" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
            {!loading && showClear && type !== 'password' ? <button type="button" tabIndex={-1} aria-label="Clear input" onMouseDown={(e) => e.preventDefault()} onClick={handleClear} className={cn('rounded-md hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]', size === 'sm' ? 'p-0.5' : 'p-1')}><ClearIcon className={size === 'sm' ? 'size-3' : 'size-3.5'} /></button> : null}
            {!loading && type === 'password' ? <button type="button" tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'} onMouseDown={(e) => e.preventDefault()} onClick={() => setShowPassword((v) => !v)} className={cn('rounded-md hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]', size === 'sm' ? 'p-0.5' : 'p-1')}><EyeIcon closed={showPassword} className={size === 'sm' ? 'size-3' : 'size-3.5'} /></button> : null}
            {!loading && trailingIcon ? <span className="flex items-center">{trailingIcon}</span> : null}
          </div>
        ) : null}
      </div>
      {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-[var(--color-text-muted)]">{hint}</p> : null}
    </div>
  );
});


Input.displayName = 'Input';

export interface DecimalNormalizationOptions { scale?: number; integer?: boolean; }
export function normalizeDecimalInput(input: string, { scale = 4, integer = false }: DecimalNormalizationOptions = {}): string {
  const decimalIndex = Math.max(input.lastIndexOf('.'), input.lastIndexOf(','));
  const hasDecimal = !integer && decimalIndex >= 0;
  const rawWhole = (hasDecimal ? input.slice(0, decimalIndex) : input).replace(/\D/g, '');
  const rawFraction = hasDecimal ? input.slice(decimalIndex + 1).replace(/\D/g, '') : '';
  const whole = rawWhole.replace(/^0+(?=\d)/, '');
  if (!hasDecimal) return whole;
  return `${whole || '0'}.${rawFraction.slice(0, Math.max(0, scale))}`;
}
export interface DecimalInputProps extends Omit<InputProps, 'inputMode' | 'onChange' | 'onNativeChange' | 'type' | 'value' | 'format'> {
  value: string; onValueChange: (value: string) => void; scale?: number; integer?: boolean;
}
export const DecimalInput = forwardRef<HTMLInputElement, DecimalInputProps>(function DecimalInput({ value, onValueChange, scale = 4, integer = false, ...props }, ref) {
  return <Input ref={ref} {...props} value={value} type="text" inputMode={integer ? 'numeric' : 'decimal'} onNativeChange={(event) => onValueChange(normalizeDecimalInput(event.target.value, { scale, integer }))} />;
});
export interface CurrencyFormatOptions { groupSeparator?: string; decimalSeparator?: string; }
export function formatCurrencyInputValue(value: string, { groupSeparator = '.', decimalSeparator = ',' }: CurrencyFormatOptions = {}): string {
  if (!value) return '';
  const normalized = normalizeDecimalInput(value); const [whole = '', fraction] = normalized.split('.');
  const grouped = (whole || '0').replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
  return fraction === undefined ? grouped : `${grouped}${decimalSeparator}${fraction}`;
}
export interface CurrencyInputProps extends Omit<DecimalInputProps, 'integer' | 'onValueChange'> {
  onValueChange: (value: string) => void; currencySymbol?: ReactNode; groupSeparator?: string; decimalSeparator?: string;
}
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(function CurrencyInput({ value, onValueChange, currencySymbol = 'Rp', groupSeparator, decimalSeparator, onFocus, onBlur, ...props }, ref) {
  const [isEditing, setEditing] = useState(false);
  const displayed = isEditing ? value : formatCurrencyInputValue(value, { ...(groupSeparator === undefined ? {} : { groupSeparator }), ...(decimalSeparator === undefined ? {} : { decimalSeparator }) });
  return <DecimalInput ref={ref} {...props} value={displayed} prefix={currencySymbol} onValueChange={onValueChange} onFocus={(event) => { setEditing(true); onFocus?.(event); }} onBlur={(event) => { setEditing(false); onBlur?.(event); }} />;
});
export type { InputSize } from '../shared';
