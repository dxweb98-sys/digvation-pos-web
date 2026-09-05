import {
  forwardRef,
  useId,
  type ChangeEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';

import { cn } from '../cn';

function ClearIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5"><path d="m18 6-12 12M6 6l12 12" /></svg>;
}

function eventWithValue(value: string): ChangeEvent<HTMLTextAreaElement> {
  return { target: { value }, currentTarget: { value } } as ChangeEvent<HTMLTextAreaElement>;
}

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: ReactNode;
  error?: ReactNode;
  hint?: ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  onChange?: (value: string, event: ChangeEvent<HTMLTextAreaElement>) => void;
  onNativeChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    error,
    hint,
    clearable = true,
    onClear,
    onChange,
    onNativeChange,
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
  const hasValue = value !== undefined && value !== null && value !== '';

  const clear = () => {
    const event = eventWithValue('');
    onClear?.();
    onChange?.('', event);
    onNativeChange?.(event);
  };

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', containerClassName)}>
      {label ? <label htmlFor={id} className="inline-block w-fit text-sm font-medium text-[var(--color-text)]">{label}</label> : null}
      <div className="relative">
        <textarea
          {...props}
          ref={ref}
          id={id}
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={Boolean(error) || undefined}
          onChange={(event) => {
            onChange?.(event.target.value, event);
            onNativeChange?.(event);
          }}
          className={cn(
            'min-h-[80px] w-full resize-y rounded-lg border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] transition-colors duration-150 placeholder:text-[var(--color-text-muted)]/60 focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)] disabled:opacity-50 read-only:bg-[var(--color-surface-muted)]',
            error ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20' : 'border-[var(--color-border)]',
            clearable && hasValue && !disabled && !readOnly && 'pr-10',
            className,
          )}
        />
        {clearable && hasValue && !disabled && !readOnly ? <button type="button" tabIndex={-1} aria-label="Clear textarea" onMouseDown={(event) => event.preventDefault()} onClick={clear} className="absolute right-2 top-2 rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"><ClearIcon /></button> : null}
      </div>
      {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-[var(--color-text-muted)]">{hint}</p> : null}
    </div>
  );
});

