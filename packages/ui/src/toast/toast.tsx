import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { cn } from '../cn';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface ToastInput {
  title: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastItem extends ToastInput {
  id: string;
}

export interface ToastContextValue {
  toasts: readonly ToastItem[];
  showToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
let toastSequence = 0;

function createToastId(): string {
  toastSequence += 1;
  return `toast-${toastSequence}`;
}

const toastClasses: Record<ToastVariant, string> = {
  info: 'border-[var(--color-brand)]/25 bg-[var(--color-surface)]',
  success: 'border-[var(--color-success)]/30 bg-[var(--color-surface)]',
  warning: 'border-[var(--color-warning)]/35 bg-[var(--color-surface)]',
  danger: 'border-[var(--color-danger)]/35 bg-[var(--color-surface)]',
};

export interface ToastProviderProps {
  children: ReactNode;
  limit?: number;
  defaultDuration?: number;
}

/** App-scoped feedback queue; feature code owns when and what it announces. */
export function ToastProvider({
  children,
  limit = 3,
  defaultDuration = 4_000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (input: ToastInput) => {
      const id = createToastId();
      const toast = { ...input, id };
      setToasts((current) => [...current, toast].slice(-Math.max(1, limit)));
      const duration = input.duration ?? defaultDuration;
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismissToast(id), duration),
        );
      }
      return id;
    },
    [defaultDuration, dismissToast, limit],
  );

  useEffect(
    () => () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
    },
    [],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, showToast, dismissToast }),
    [dismissToast, showToast, toasts],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <section
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto flex gap-3 rounded-[var(--radius-control)] border p-3 shadow-lg',
              toastClasses[toast.variant ?? 'info'],
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description ? (
                <div className="mt-0.5 text-xs leading-5 text-[var(--color-text-muted)]">
                  {toast.description}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismissToast(toast.id)}
              className="rounded-md px-1 text-lg leading-none text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/20"
            >
              ×
            </button>
          </section>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider.');
  return context;
}
