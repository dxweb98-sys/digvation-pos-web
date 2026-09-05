import { type HTMLAttributes } from 'react';

import { cn } from '../cn';

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  value?: number;
  label?: string;
}

function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function Progress({ value, label, className, ...props }: ProgressProps) {
  const isIndeterminate = value === undefined;
  const percentage = isIndeterminate ? undefined : clampProgress(value);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={isIndeterminate ? undefined : 0}
      aria-valuemax={isIndeterminate ? undefined : 100}
      aria-valuenow={percentage}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'block h-full rounded-full bg-[var(--color-brand)] transition-[width] duration-200',
          isIndeterminate && 'w-2/5 animate-[boot-progress_1.2s_ease-in-out_infinite]',
        )}
        style={isIndeterminate ? undefined : { width: `${percentage}%` }}
      />
    </div>
  );
}
