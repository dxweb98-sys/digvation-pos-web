import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cn } from '../cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-brand)] text-white shadow-sm hover:brightness-95',
  secondary: 'bg-[var(--color-surface-muted)] text-[var(--color-text)] hover:brightness-98',
  outline:
    'border border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]',
  ghost: 'bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]',
  danger: 'bg-[var(--color-danger)] text-white shadow-sm hover:brightness-95',
  success: 'bg-[var(--color-success)] text-white shadow-sm hover:brightness-95',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-base',
  icon: 'size-10 p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    type = 'button',
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/20 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leftIcon
      )}
      {children ? <span>{children}</span> : null}
      {!loading ? rightIcon : null}
    </button>
  );
});
