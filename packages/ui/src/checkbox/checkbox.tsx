import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '../cn';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, ...props },
  ref,
) {
  return (
    <span className={cn('inline-flex size-4 shrink-0', className)}>
      <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
      <span className="grid size-4 place-items-center rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-white transition-colors peer-checked:border-[var(--color-brand)] peer-checked:bg-[var(--color-brand)] peer-checked:[&>svg]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-brand)]/20 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
        <svg viewBox="0 0 12 12" className="size-3 opacity-0" aria-hidden="true">
          <path
            d="m2 6 2.4 2.4L10 2.8"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      </span>
    </span>
  );
});
