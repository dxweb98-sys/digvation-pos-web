import { useEffect, useRef, useState } from 'react';

import { cn } from '../cn';

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
}
function ClearIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5"><path d="m18 6-12 12M6 6l12 12" /></svg>;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  align?: 'left' | 'right';
  expandedWidth?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Cari...',
  debounceMs = 300,
  className,
  align = 'right',
  expandedWidth = '280px',
}: SearchInputProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const desktopInputRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const lastEmittedRef = useRef(value);
  const [active, setActive] = useState(Boolean(value));
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    setLocalValue(value);
    lastEmittedRef.current = value;
    if (value) setActive(true);
  }, [value]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (localValue === lastEmittedRef.current) return;
      lastEmittedRef.current = localValue;
      onChange(localValue);
    }, debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [debounceMs, localValue, onChange]);

  useEffect(() => {
    if (!active) return;
    requestAnimationFrame(() => desktopInputRef.current?.focus());
  }, [active]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node) && !localValue) setActive(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [localValue]);

  const emitImmediately = (next: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    lastEmittedRef.current = next;
    onChange(next);
  };

  const clearSearch = () => {
    setLocalValue('');
    emitImmediately('');
    setActive(false);
  };

  return (
    <div ref={wrapperRef} className={cn('w-full sm:w-auto', align === 'right' ? 'sm:mr-3' : 'sm:ml-0', className)}>
      <div className="relative block w-full sm:hidden">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"><SearchIcon /></span>
        <input type="text" value={localValue} onChange={(event) => { setLocalValue(event.target.value); if (event.target.value) setActive(true); }} placeholder={placeholder} className="h-9 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] pl-9 pr-9 text-sm outline-none shadow-sm placeholder:text-[var(--color-text-muted)]/70 focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20" />
        {localValue ? <button type="button" aria-label="Clear search" onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"><ClearIcon /></button> : null}
      </div>
      <div className={cn('relative hidden items-center transition-[width] duration-200 ease-out sm:flex', align === 'right' ? 'justify-end' : 'justify-start')} style={{ width: active ? expandedWidth : '44px' }}>
        <div className={cn('relative h-9 w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm transition-all duration-200 ease-out focus-within:border-[var(--color-brand)] focus-within:ring-2 focus-within:ring-[var(--color-brand)]/20', active ? 'cursor-text' : 'cursor-pointer hover:bg-[var(--color-surface-muted)]')} onClick={() => setActive(true)}>
          <span className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-all duration-200 ease-out', active ? 'left-3' : 'left-1/2 -translate-x-1/2')}><SearchIcon /></span>
          <input ref={desktopInputRef} type="text" value={localValue} onChange={(event) => { setLocalValue(event.target.value); if (event.target.value) setActive(true); }} onKeyDown={(event) => { if (event.key === 'Escape') clearSearch(); }} placeholder={placeholder} className={cn('h-full w-full bg-transparent pl-9 pr-9 text-sm outline-none placeholder:text-[var(--color-text-muted)]/70 transition-opacity duration-150 ease-out', active ? 'opacity-100' : 'pointer-events-none opacity-0')} />
          {active && localValue ? <button type="button" aria-label="Clear search" onClick={(event) => { event.preventDefault(); event.stopPropagation(); clearSearch(); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"><ClearIcon /></button> : null}
        </div>
      </div>
    </div>
  );
}

