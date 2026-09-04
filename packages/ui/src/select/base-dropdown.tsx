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

export interface BaseDropdownProps {
  trigger: (context: { open: boolean }) => ReactNode;
  children: ReactNode;
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  matchWidth?: boolean;
  onClose?: () => void;
  closeOnItemClick?: boolean;
  closeOnEsc?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Port of ui-old BaseDropdown using the current shared package dependencies. */
export function BaseDropdown({
  trigger,
  children,
  placement = 'bottom-start',
  matchWidth = false,
  onClose,
  closeOnItemClick = false,
  closeOnEsc = true,
  open: controlledOpen,
  onOpenChange,
}: BaseDropdownProps) {
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
    setOpen(false);
    onClose?.();
  }, [onClose, setOpen]);

  const updatePosition = useCallback(() => {
    const reference = referenceRef.current;
    if (!reference) return;
    const rect = reference.getBoundingClientRect();
    const isTop = placement.startsWith('top');
    const isEnd = placement.endsWith('end');
    setStyle({
      position: 'fixed',
      zIndex: 9999,
      ...(matchWidth ? { width: reference.offsetWidth } : {}),
      ...(isEnd ? { right: window.innerWidth - rect.right } : { left: rect.left }),
      ...(isTop ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
    });
  }, [matchWidth, placement]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const outside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!referenceRef.current?.contains(target) && !floatingRef.current?.contains(target))
        close();
    };
    const escape = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape') close();
    };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [close, closeOnEsc, open, updatePosition]);

  const context = useMemo(() => ({ open }), [open]);

  return (
    <>
      <div
        ref={referenceRef}
        className="inline-block w-full"
        onClick={(event) => {
          if (event.defaultPrevented) return;
          event.stopPropagation();
          setOpen((value) => !value);
          requestAnimationFrame(updatePosition);
        }}
      >
        {trigger(context)}
      </div>
      {open
        ? createPortal(
            <div
              ref={floatingRef}
              role="listbox"
              tabIndex={-1}
              style={style}
              onClick={(event) => {
                if (!closeOnItemClick) return;
                if ((event.target as HTMLElement).closest("button, [role='option'], a")) close();
              }}
              className={cn(
                'z-[9999] min-w-[140px] animate-[dropdown-in_150ms_ease-out] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-xl',
              )}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
