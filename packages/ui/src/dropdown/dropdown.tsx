import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../cn';
import { DropdownContext } from './dropdown-context';

export interface DropdownProps {
  trigger: (context: { open: boolean }) => ReactNode;
  children: ReactNode;
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  matchWidth?: boolean;
  onClose?: () => void;
  closeOnItemClick?: boolean;
  closeOnEsc?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  contentRole?: 'listbox' | 'menu' | 'dialog';
  className?: string;
  contentClassName?: string;
  offset?: number;
  minWidth?: number;
}

export function Dropdown({
  trigger,
  children,
  placement = 'bottom-start',
  matchWidth = false,
  onClose,
  closeOnItemClick = false,
  closeOnEsc = true,
  open: controlledOpen,
  onOpenChange,
  contentRole = 'menu',
  className,
  contentClassName,
  offset = 6,
  minWidth = 140,
}: DropdownProps) {
  const referenceRef = useRef<HTMLDivElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const [style, setStyle] = useState<CSSProperties>({});

  const setOpen = useCallback(
    (next: boolean | ((current: boolean) => boolean)) => {
      const resolved = typeof next === 'function' ? next(open) : next;
      if (controlledOpen === undefined) setUncontrolledOpen(resolved);
      onOpenChange?.(resolved);
    },
    [controlledOpen, onOpenChange, open],
  );

  const close = useCallback(() => {
    if (!open) return;
    setOpen(false);
    onClose?.();
  }, [onClose, open, setOpen]);

  const updatePosition = useCallback(() => {
    const reference = referenceRef.current;
    const floating = floatingRef.current;
    if (!reference) return;

    const rect = reference.getBoundingClientRect();
    const floatingHeight = floating?.offsetHeight ?? 0;
    const floatingWidth = floating?.offsetWidth ?? (matchWidth ? rect.width : minWidth);
    const viewportPadding = 8;
    const preferredTop = placement.startsWith('top');
    const preferredEnd = placement.endsWith('end');
    const roomBelow = window.innerHeight - rect.bottom - viewportPadding;
    const roomAbove = rect.top - viewportPadding;
    const placeTop = preferredTop ? roomAbove >= floatingHeight || roomAbove > roomBelow : roomBelow < floatingHeight && roomAbove > roomBelow;

    let left = preferredEnd ? rect.right - floatingWidth : rect.left;
    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - floatingWidth - viewportPadding));

    setStyle({
      position: 'fixed',
      zIndex: 9999,
      minWidth,
      ...(matchWidth ? { width: rect.width } : {}),
      left,
      ...(placeTop
        ? { bottom: Math.max(viewportPadding, window.innerHeight - rect.top + offset) }
        : { top: Math.min(window.innerHeight - viewportPadding, rect.bottom + offset) }),
    });
  }, [matchWidth, minWidth, offset, placement]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(updatePosition);
    const outside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!referenceRef.current?.contains(target) && !floatingRef.current?.contains(target)) close();
    };
    const escape = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape') close();
    };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [close, closeOnEsc, open, updatePosition]);

  const context = useMemo(() => ({ close, open }), [close, open]);

  return (
    <DropdownContext.Provider value={context}>
      <div
        ref={referenceRef}
        className={cn('inline-block', matchWidth && 'w-full', className)}
        onClick={(event) => {
          if (event.defaultPrevented) return;
          event.stopPropagation();
          setOpen((value) => !value);
          requestAnimationFrame(updatePosition);
        }}
        onKeyDown={(event) => {
          if (event.defaultPrevented) return;
          if (event.key === 'Enter' || event.key === ' ') {
            const target = event.target as HTMLElement;
            if (target.tagName === 'BUTTON' || target.tagName === 'INPUT') return;
            event.preventDefault();
            event.stopPropagation();
            setOpen((value) => !value);
            requestAnimationFrame(updatePosition);
          }
        }}
      >
        {trigger({ open })}
      </div>
      {open
        ? createPortal(
            <div
              ref={floatingRef}
              role={contentRole}
              tabIndex={-1}
              style={style}
              onClick={(event) => {
                if (!closeOnItemClick) return;
                const target = event.target as HTMLElement;
                if (target.closest("button, [role='option'], [role='menuitem'], a")) close();
              }}
              className={cn(
                'z-[9999] min-w-[140px] animate-[dropdown-in_150ms_ease-out] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-xl',
                contentClassName,
              )}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </DropdownContext.Provider>
  );
}

