import { useEffect, useId, useState, type ReactNode } from 'react';

import { cn } from '../cn';
import { Dropdown, useDropdownClose } from '../dropdown';
import { INPUT_SIZE_STYLES, type InputSize } from '../shared';

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function ChevronLeftIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><path d="m15 18-6-6 6-6" /></svg>; }
function ChevronRightIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><path d="m9 18 6-6-6-6" /></svg>; }
function CalendarIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>; }
function ClearIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5"><path d="m18 6-12 12M6 6l12 12" /></svg>; }

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}
function toValue(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function compareDateValue(value: string, boundary?: string) {
  if (!boundary) return 0;
  return value.localeCompare(boundary);
}

export interface DatePickerProps {
  label?: ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  error?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  clearable?: boolean;
  containerClassName?: string;
  minDate?: string;
  maxDate?: string;
  size?: InputSize;
}

function DatePickerContent({ value, onChange, minDate, maxDate }: Pick<DatePickerProps, 'value' | 'onChange' | 'minDate' | 'maxDate'>) {
  const close = useDropdownClose();
  const today = new Date();
  const selectedDate = parseDate(value);
  const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() ?? today.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() ?? today.getFullYear());

  useEffect(() => {
    if (!selectedDate) return;
    setViewMonth(selectedDate.getMonth());
    setViewYear(selectedDate.getFullYear());
  }, [value]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const move = (amount: number) => {
    const next = new Date(viewYear, viewMonth + amount, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };
  const selectDate = (day: number) => {
    const next = toValue(viewYear, viewMonth, day);
    if ((minDate && compareDateValue(next, minDate) < 0) || (maxDate && compareDateValue(next, maxDate) > 0)) return;
    onChange?.(next);
    close?.();
  };
  const todayValue = toValue(today.getFullYear(), today.getMonth(), today.getDate());
  const todayDisabled = (minDate && compareDateValue(todayValue, minDate) < 0) || (maxDate && compareDateValue(todayValue, maxDate) > 0);

  return (
    <div className="w-[280px] p-3">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Previous month" onClick={() => move(-1)} className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"><ChevronLeftIcon /></button>
        <span className="text-sm font-medium text-[var(--color-text)]">{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" aria-label="Next month" onClick={() => move(1)} className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"><ChevronRightIcon /></button>
      </div>
      <div className="mb-1 grid grid-cols-7 text-xs">{DAYS.map((day) => <div key={day} className="text-center text-[var(--color-text-muted)]">{day}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, index) => <div key={`empty-${index}`} />)}
        {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
          const dateValue = toValue(viewYear, viewMonth, day);
          const selected = value === dateValue;
          const outside = (minDate && compareDateValue(dateValue, minDate) < 0) || (maxDate && compareDateValue(dateValue, maxDate) > 0);
          return <button key={day} type="button" disabled={Boolean(outside)} onClick={() => selectDate(day)} className={cn('aspect-square w-full rounded text-sm transition-colors hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-30', selected && 'bg-[var(--color-brand)] font-medium text-white hover:bg-[var(--color-brand)]')}>{day}</button>;
        })}
      </div>
      <div className="mt-2 border-t border-[var(--color-border)] pt-2"><button type="button" disabled={Boolean(todayDisabled)} onClick={() => { onChange?.(todayValue); close?.(); }} className="text-xs text-[var(--color-brand)] hover:underline disabled:cursor-not-allowed disabled:opacity-40">Hari ini</button></div>
    </div>
  );
}

export function DatePicker({
  label,
  value,
  onChange,
  onClear,
  placeholder = 'Pilih tanggal',
  error,
  hint,
  disabled = false,
  clearable = true,
  containerClassName,
  minDate,
  maxDate,
  size = 'md',
}: DatePickerProps) {
  const id = useId();
  const s = INPUT_SIZE_STYLES[size];
  const display = (() => {
    const date = parseDate(value);
    if (!date) return '';
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  })();

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', containerClassName)}>
      {label ? <label htmlFor={id} className={cn(s.label, 'w-fit font-medium text-[var(--color-text)]')}>{label}</label> : null}
      <Dropdown contentRole="dialog" trigger={() => (
        <div className="relative">
          <button id={id} type="button" disabled={disabled} className={cn('flex w-full items-center gap-2 rounded-lg border bg-[var(--color-surface)] text-left text-[var(--color-text)] transition-colors focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)] disabled:opacity-50', s.input, error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]', !value && 'text-[var(--color-text-muted)]/60', clearable && value && 'pr-10')}>
            <span className="text-[var(--color-text-muted)]"><CalendarIcon /></span><span className="min-w-0 flex-1 truncate">{display || placeholder}</span>
          </button>
          {clearable && value && !disabled ? <button type="button" aria-label="Clear date" onMouseDown={(event) => event.preventDefault()} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onChange?.(''); onClear?.(); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"><ClearIcon /></button> : null}
        </div>
      )}>
        <DatePickerContent {...(value === undefined ? {} : { value })} {...(onChange === undefined ? {} : { onChange })} {...(minDate === undefined ? {} : { minDate })} {...(maxDate === undefined ? {} : { maxDate })} />
      </Dropdown>
      {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-[var(--color-text-muted)]">{hint}</p> : null}
    </div>
  );
}

