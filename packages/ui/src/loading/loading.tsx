import { useEffect, useState, type ReactNode } from 'react';

import { cn } from '../cn';

export function LoadingIndicator({
  label = 'Loading...',
  className,
}: {
  label?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        'inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)]',
        className,
      )}
    >
      <span className="size-4 animate-spin rounded-full border-2 border-[var(--color-brand)] border-t-transparent" />
      {label}
    </div>
  );
}

export function LoadingOverlay({ label = 'Loading...' }: { label?: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-[var(--color-background)]/75 backdrop-blur-sm">
      <LoadingIndicator label={label} />
    </div>
  );
}

export interface SplashScreenProps {
  title: ReactNode;
  subtitle?: ReactNode;
  mark?: ReactNode;
  minDuration?: number;
  onFinish?: () => void;
}

/** Visual loading presentation only; each app retains bootstrap timing ownership. */
export function SplashScreen({
  title,
  subtitle,
  mark = 'D.',
  minDuration,
  onFinish,
}: SplashScreenProps) {
  const [isLeaving, setLeaving] = useState(false);
  useEffect(() => {
    if (minDuration === undefined || !onFinish) return;
    const leaveTimer = setTimeout(() => setLeaving(true), minDuration);
    const finishTimer = setTimeout(onFinish, minDuration + 350);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(finishTimer);
    };
  }, [minDuration, onFinish]);
  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] grid place-items-center bg-[var(--color-background)] transition-opacity duration-300',
        isLeaving && 'opacity-0',
      )}
    >
      <div
        className={cn(
          'flex flex-col items-center transition-all duration-500',
          isLeaving && '-translate-y-4 scale-95 opacity-0',
        )}
      >
        <div className="mb-5 grid size-16 place-items-center rounded-2xl bg-[var(--color-brand)] text-2xl font-bold text-white shadow-lg shadow-blue-500/20">
          {mark}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{subtitle}</p>
        ) : null}
        <div className="mt-7 flex gap-1.5">
          <span className="size-2 animate-pulse rounded-full bg-[var(--color-brand)]" />
          <span className="size-2 animate-pulse rounded-full bg-[var(--color-brand)] [animation-delay:150ms]" />
          <span className="size-2 animate-pulse rounded-full bg-[var(--color-brand)] [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
