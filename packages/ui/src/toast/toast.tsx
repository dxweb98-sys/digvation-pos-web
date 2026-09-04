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
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider.');
  return context;
}




export type ControlledToastVariant = 'info' | 'success' | 'warning' | 'danger' | 'error';
export interface ControlledToastItem { id: string; title: ReactNode; description?: ReactNode; variant?: ControlledToastVariant; }
export interface ToastContainerProps { toasts: readonly ControlledToastItem[]; onDismiss: (id: string) => void; className?: string; }

const toastStyle: Record<ControlledToastVariant, { wrap: string; icon: string }> = {
  info: { wrap: 'border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10', icon: 'text-[var(--color-brand)]' },
  success: { wrap: 'border-[var(--color-success)]/30 bg-[var(--color-success)]/10', icon: 'text-[var(--color-success)]' },
  warning: { wrap: 'border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10', icon: 'text-[var(--color-warning)]' },
  danger: { wrap: 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10', icon: 'text-[var(--color-danger)]' },
  error: { wrap: 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10', icon: 'text-[var(--color-danger)]' },
};
function ToastIcon({ variant }: { variant: ControlledToastVariant }) {
  if (variant === 'success') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px]"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>;
  if (variant === 'warning') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px]"><path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v4M12 17h.01"/></svg>;
  if (variant === 'danger' || variant === 'error') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px]"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px]"><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></svg>;
}
function ToastCloseIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5"><path d="m18 6-12 12M6 6l12 12"/></svg>; }

/** Controlled viewport matching oldUi ToastContainer visuals without coupling UI to an app store. */
export function ToastContainer({ toasts, onDismiss, className }: ToastContainerProps) {
  if (!toasts.length) return null;
  return (
    <div aria-live="polite" aria-relevant="additions" className={cn('pointer-events-none fixed right-4 top-4 z-[9998] flex w-full max-w-sm flex-col gap-2', className)}>
      {toasts.map((toast) => {
        const variant = toast.variant ?? 'info';
        const style = toastStyle[variant];
        return (
          <section key={toast.id} role="status" className={cn('pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm animate-[toast-in_180ms_ease-out]', style.wrap)}>
            <span className={cn('shrink-0', style.icon)}><ToastIcon variant={variant} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-text)]">{toast.title}</p>
              {toast.description ? <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">{toast.description}</div> : null}
            </div>
            <button type="button" aria-label="Dismiss notification" onClick={() => onDismiss(toast.id)} className="shrink-0 rounded p-0.5 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"><ToastCloseIcon /></button>
          </section>
        );
      })}
    </div>
  );
}

