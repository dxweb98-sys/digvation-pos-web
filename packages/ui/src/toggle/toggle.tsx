import type { ReactNode } from 'react';
import { cn } from '../cn';

export interface ToggleProps {
  label?: ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md';
  labelPosition?: 'left' | 'right' | 'top' | 'bottom';
  gap?: string;
  className?: string;
  ariaLabel?: string;
}

export function Toggle({
  label,
  checked = false,
  onChange,
  disabled = false,
  fullWidth = false,
  size = 'md',
  labelPosition = 'left',
  gap = 'gap-2.5',
  className,
  ariaLabel,
}: ToggleProps) {
  const trackSize = size === 'sm' ? 'h-4 w-8' : 'h-5 w-10';
  const thumbSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const translate = size === 'sm' ? 'translate-x-4' : 'translate-x-5';
  const isVertical = labelPosition === 'top' || labelPosition === 'bottom';
  const labelEl = label ? <span className="text-sm text-[var(--color-text)]">{label}</span> : null;
  const toggleEl = (
    <button
      type="button"
      role="switch"
      aria-label={ariaLabel}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20',
        trackSize,
        checked ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-border)]',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
      )}
    >
      <span className={cn('inline-block rounded-full bg-[var(--color-surface)] shadow-sm transition-transform duration-200', thumbSize, checked ? translate : 'translate-x-0.5')} />
    </button>
  );
  const content = labelPosition === 'right' ? <>{toggleEl}{labelEl}</> : labelPosition === 'top' ? <>{labelEl}{toggleEl}</> : labelPosition === 'bottom' ? <>{toggleEl}{labelEl}</> : <>{labelEl}{toggleEl}</>;
  return <div className={cn(fullWidth ? 'flex w-full items-center justify-between' : 'inline-flex items-center', isVertical && 'flex-col items-start', gap, disabled && 'opacity-50', className)}>{content}</div>;
}
