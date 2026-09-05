import { type HTMLAttributes } from 'react';

import { cn } from '../cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        'rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border-b border-[var(--color-border)] px-4 py-3', className)} {...props} />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border-t border-[var(--color-border)] px-4 py-3', className)} {...props} />
  );
}
