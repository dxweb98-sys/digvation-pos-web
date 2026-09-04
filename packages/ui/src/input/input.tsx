import {
  forwardRef,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '../cn';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'size'> {
  label?: ReactNode;
  labelInfo?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  size?: InputSize;
  leftAdornment?: ReactNode;
  leftIcon?: ReactNode;
  rightAdornment?: ReactNode;
  rightIcon?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  loading?: boolean;
  containerClassName?: string;
}

const inputSizeClasses: Record<InputSize, { input: string; label: string; icon: string }> = {
  sm: { input: 'h-8 px-2 text-xs', label: 'text-xs', icon: 'size-3.5' },
  md: { input: 'h-10 px-3 text-sm', label: 'text-sm', icon: 'size-4' },
  lg: { input: 'h-12 px-4 text-base', label: 'text-base', icon: 'size-4' },
};

function hasInputValue(value: InputProps['value']): boolean {
  return value !== undefined && value !== null && value !== '';
}

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="m18 6-12 12M6 6l12 12" />
    </svg>
  );
}

function EyeIcon({ closed, className }: { closed?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      {closed ? <path d="m3 3 18 18" /> : null}
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6M12 7h.01" />
    </svg>
  );
}

/** Canonical port of ui-old's BaseInput layout. Decimal wrappers retain canonical text values. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    containerClassName,
    type = 'text',
    label,
    labelInfo,
    hint,
    error,
    size = 'md',
    leftAdornment,
    leftIcon,
    rightAdornment,
    rightIcon,
    prefix,
    suffix,
    clearable = true,
    onClear,
    loading = false,
    value,
    disabled,
    id: providedId,
    readOnly,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isInfoVisible, setInfoVisible] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);
  const sizeClasses = inputSizeClasses[size];
  const leadingIcon = leftAdornment ?? leftIcon;
  const trailingIcon = rightAdornment ?? rightIcon;
  const canClear = clearable && hasInputValue(value) && !disabled && !readOnly && !loading;
  const canTogglePassword = type === 'password' && !disabled && !readOnly && !loading;
  const inputType = canTogglePassword && isPasswordVisible ? 'text' : type;
  const hasLeading = Boolean(leadingIcon || prefix);
  const hasTrailing = Boolean(trailingIcon || suffix || canClear || canTogglePassword || loading);

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', containerClassName)}>
      {label ? (
        <div className="flex w-fit items-center gap-1.5">
          <label
            htmlFor={id}
            className={cn(sizeClasses.label, 'font-medium text-[var(--color-text)]')}
          >
            {label}
          </label>
          {labelInfo ? (
            <div ref={infoRef} className="group relative flex items-center">
              <button
                type="button"
                aria-label="Field information"
                aria-expanded={isInfoVisible}
                onClick={() => setInfoVisible((visible) => !visible)}
                onBlur={(event) => {
                  if (!infoRef.current?.contains(event.relatedTarget)) setInfoVisible(false);
                }}
                className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              >
                <InfoIcon className="size-3.5" />
              </button>
              <div
                role="tooltip"
                className={cn(
                  'invisible absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[220px] -translate-x-1/2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100',
                  isInfoVisible && 'visible opacity-100',
                )}
              >
                <div className="relative rounded-lg bg-[#1f2a44] px-3 py-2 text-xs text-white shadow-lg">
                  {labelInfo}
                  <div className="absolute left-1/2 top-full size-0 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-[#1f2a44]" />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="relative flex min-w-0 items-center">
        {leadingIcon ? (
          <span
            className={cn(
              'pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--color-text-muted)]',
              `[&>svg]:${sizeClasses.icon}`,
            )}
          >
            {leadingIcon}
          </span>
        ) : null}
        {prefix ? (
          <span
            className={cn(
              'pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 font-medium text-[var(--color-text-muted)]',
              size === 'sm' ? 'text-xs' : 'text-sm',
            )}
          >
            {prefix}
          </span>
        ) : null}
        <input
          ref={ref}
          id={id}
          autoComplete={props.autoComplete ?? 'off'}
          type={inputType}
          value={value}
          disabled={disabled || loading}
          readOnly={readOnly}
          aria-invalid={Boolean(error) || undefined}
          aria-busy={loading || undefined}
          className={cn(
            'w-full min-w-0 rounded-lg border bg-[var(--color-surface)] text-[var(--color-text)] transition-colors duration-150 placeholder:text-[var(--color-text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 focus:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)] disabled:opacity-50 read-only:bg-[var(--color-surface-muted)]',
            sizeClasses.input,
            error
              ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20'
              : 'border-[var(--color-border)]',
            hasLeading && (size === 'sm' ? 'pl-8' : 'pl-10'),
            hasTrailing && (size === 'sm' ? 'pr-8' : 'pr-10'),
            className,
          )}
          {...props}
        />
        {suffix ? (
          <span
            className={cn(
              'pointer-events-none absolute top-1/2 -translate-y-1/2 font-medium text-[var(--color-text-muted)]',
              size === 'sm' ? 'right-2.5 text-xs' : 'right-3 text-sm',
            )}
          >
            {suffix}
          </span>
        ) : null}
        {hasTrailing ? (
          <div
            className={cn(
              'absolute top-1/2 flex -translate-y-1/2 items-center text-[var(--color-text-muted)]',
              size === 'sm' ? 'right-1.5 gap-0.5' : 'right-2 gap-1',
              suffix && 'pointer-events-none opacity-0',
            )}
          >
            {loading ? (
              <span
                aria-label="Loading"
                className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
            ) : null}
            {!loading && canClear && type !== 'password' ? (
              <button
                type="button"
                tabIndex={-1}
                aria-label="Clear input"
                onMouseDown={(event) => event.preventDefault()}
                onClick={onClear}
                className={cn(
                  'rounded-md transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]',
                  size === 'sm' ? 'p-0.5' : 'p-1',
                )}
              >
                <ClearIcon className={size === 'sm' ? 'size-3' : 'size-3.5'} />
              </button>
            ) : null}
            {!loading && canTogglePassword ? (
              <button
                type="button"
                tabIndex={-1}
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setPasswordVisible((visible) => !visible)}
                className={cn(
                  'rounded-md transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]',
                  size === 'sm' ? 'p-0.5' : 'p-1',
                )}
              >
                <EyeIcon
                  closed={isPasswordVisible}
                  className={size === 'sm' ? 'size-3' : 'size-3.5'}
                />
              </button>
            ) : null}
            {!loading && trailingIcon ? (
              <span className="flex items-center">{trailingIcon}</span>
            ) : null}
          </div>
        ) : null}
      </div>
      {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-[var(--color-text-muted)]">{hint}</p> : null}
    </div>
  );
});

export interface DecimalNormalizationOptions {
  scale?: number;
  integer?: boolean;
}

/** Normalizes editable decimal text without converting it to a JavaScript number. */
export function normalizeDecimalInput(
  input: string,
  { scale = 4, integer = false }: DecimalNormalizationOptions = {},
): string {
  const decimalIndex = Math.max(input.lastIndexOf('.'), input.lastIndexOf(','));
  const hasDecimal = !integer && decimalIndex >= 0;
  const rawWhole = (hasDecimal ? input.slice(0, decimalIndex) : input).replace(/\D/g, '');
  const rawFraction = hasDecimal ? input.slice(decimalIndex + 1).replace(/\D/g, '') : '';
  const whole = rawWhole.replace(/^0+(?=\d)/, '');
  if (!hasDecimal) return whole;
  return `${whole || '0'}.${rawFraction.slice(0, Math.max(0, scale))}`;
}

export interface DecimalInputProps extends Omit<
  InputProps,
  'inputMode' | 'onChange' | 'type' | 'value'
> {
  value: string;
  onValueChange: (value: string) => void;
  scale?: number;
  integer?: boolean;
}

export const DecimalInput = forwardRef<HTMLInputElement, DecimalInputProps>(function DecimalInput(
  { value, onValueChange, scale = 4, integer = false, ...props },
  ref,
) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValueChange(normalizeDecimalInput(event.target.value, { scale, integer }));
  };

  return (
    <Input
      ref={ref}
      {...props}
      value={value}
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      onChange={handleChange}
    />
  );
});

export interface CurrencyFormatOptions {
  groupSeparator?: string;
  decimalSeparator?: string;
}

/** Formats a canonical decimal string for display only; it does not calculate money. */
export function formatCurrencyInputValue(
  value: string,
  { groupSeparator = '.', decimalSeparator = ',' }: CurrencyFormatOptions = {},
): string {
  if (!value) return '';
  const normalized = normalizeDecimalInput(value);
  const [whole = '', fraction] = normalized.split('.');
  const grouped = (whole || '0').replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
  return fraction === undefined ? grouped : `${grouped}${decimalSeparator}${fraction}`;
}

export interface CurrencyInputProps extends Omit<DecimalInputProps, 'integer' | 'onValueChange'> {
  onValueChange: (value: string) => void;
  currencySymbol?: ReactNode;
  groupSeparator?: string;
  decimalSeparator?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput(
    {
      value,
      onValueChange,
      currencySymbol = 'Rp',
      groupSeparator,
      decimalSeparator,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) {
    const [isEditing, setEditing] = useState(false);

    return (
      <DecimalInput
        ref={ref}
        {...props}
        value={
          isEditing
            ? value
            : formatCurrencyInputValue(value, {
                ...(groupSeparator === undefined ? {} : { groupSeparator }),
                ...(decimalSeparator === undefined ? {} : { decimalSeparator }),
              })
        }
        prefix={currencySymbol}
        onValueChange={onValueChange}
        onFocus={(event) => {
          setEditing(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setEditing(false);
          onBlur?.(event);
        }}
      />
    );
  },
);
