import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../cn';

const FOCUSABLE_SELECTOR = ['a[href]','button:not([disabled])','input:not([disabled])','select:not([disabled])','textarea:not([disabled])','[tabindex]:not([tabindex="-1"])'].join(',');

interface DialogRootProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  className?: string;
  overlayClassName?: string;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true');
}

function DialogRoot({
  open,
  onClose,
  children,
  ariaLabel,
  ariaLabelledBy,
  className,
  overlayClassName,
  closeOnOverlay = false,
  closeOnEscape = false,
}: DialogRootProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const timer = window.setTimeout(() => setMounted(false), 300);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousActive = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => dialogRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = getFocusableElements(dialogRef.current);
      if (focusable.length === 0) { event.preventDefault(); dialogRef.current.focus(); return; }
      const index = focusable.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); focusable[focusable.length - 1]?.focus(); }
      else if (!event.shiftKey && index === focusable.length - 1) { event.preventDefault(); focusable[0]?.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousActive instanceof HTMLElement) previousActive.focus();
    };
  }, [closeOnEscape, onClose, open]);
  if (!mounted) return null;
  return createPortal(
    <div className={cn('fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[1px] transition-opacity duration-300 sm:items-center sm:p-4', open ? 'opacity-100' : 'opacity-0', overlayClassName)} onMouseDown={(event) => { if (closeOnOverlay && event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-label={ariaLabelledBy ? undefined : ariaLabel} aria-labelledby={ariaLabelledBy} tabIndex={-1} className={className}>{children}</section>
    </div>,
    document.body,
  );
}

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: DialogSize;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showClose?: boolean;
  noPadding?: boolean;
  className?: string;
  overlayClassName?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
}
const sizeClasses: Record<DialogSize, string> = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl', full: 'sm:max-w-[95vw]' };
function CloseIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px]"><path d="m18 6-12 12M6 6l12 12" /></svg>; }

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
  closeOnEscape = true,
  showClose = true,
  noPadding = false,
  className,
  overlayClassName,
  ariaLabel,
  ariaLabelledBy,
}: DialogProps) {
  return (
    <DialogRoot open={open} onClose={onClose} closeOnOverlay={closeOnOverlay} closeOnEscape={closeOnEscape} ariaLabelledBy={ariaLabelledBy} ariaLabel={ariaLabel ?? (typeof title === 'string' ? title : 'Dialog')} overlayClassName={overlayClassName} className={cn('flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-[var(--color-surface)] shadow-xl transition-all duration-300 sm:max-h-[85vh] sm:rounded-xl', open ? 'translate-y-0 opacity-100 sm:scale-100' : 'translate-y-full opacity-0 sm:translate-y-0 sm:scale-95', sizeClasses[size], className)}>
      <div className="flex justify-center pb-1 pt-3 sm:hidden"><div className="h-1 w-10 rounded-full bg-[var(--color-border)]" /></div>
      {(title || description || showClose) ? <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3 sm:px-6 sm:py-4"><div className="min-w-0">{title ? <h3 className="text-lg font-semibold text-[var(--color-text)]">{title}</h3> : null}{description ? <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{description}</p> : null}</div>{showClose ? <button type="button" aria-label="Close dialog" onClick={onClose} className="rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)]"><CloseIcon /></button> : null}</div> : null}
      <div className={cn('flex-1 overflow-y-auto', !noPadding && 'px-5 py-4 sm:px-6')}>{children}</div>
      {footer ? <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]/30 px-5 py-3 sm:rounded-b-xl sm:px-6">{footer}</div> : null}
    </DialogRoot>
  );
}


