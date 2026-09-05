import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';

import { cn } from '../cn';
import { Dropdown, useDropdownClose } from '../dropdown';
import { INPUT_SIZE_STYLES, type InputSize } from '../shared';

export interface DateRangeValue { start?: string; end?: string; }
export interface RangeDatePickerProps {
  label?: ReactNode;
  placeholder?: string;
  value?: DateRangeValue;
  size?: InputSize;
  onChange?: (value: DateRangeValue) => void;
  error?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  clearable?: boolean;
  containerClassName?: string;
}

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDate = (value?: string) => value ? new Date(`${value}T00:00:00`) : null;
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addMonth = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth() + amount, 1);
const isSameDate = (a?: Date | null, b?: Date | null) => Boolean(a && b && formatDate(a) === formatDate(b));
const formatDisplayDate = (value: string) => { const date = parseDate(value); return date ? `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}` : ''; };
const getStartOfWeek = (date: Date) => { const result = new Date(date); const day = result.getDay(); result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day)); result.setHours(0,0,0,0); return result; };
const getEndOfWeek = (date: Date) => { const result = getStartOfWeek(date); result.setDate(result.getDate() + 6); return result; };
const getStartOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const getEndOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const getStartOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);
const getEndOfYear = (date: Date) => new Date(date.getFullYear(), 11, 31);

type QuickRangeType = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'all_time';
const QUICK_RANGE_OPTIONS: { label: string; value: QuickRangeType }[] = [
  { label: 'Today', value: 'today' }, { label: 'Yesterday', value: 'yesterday' }, { label: 'This week', value: 'this_week' }, { label: 'Last week', value: 'last_week' }, { label: 'This month', value: 'this_month' }, { label: 'Last month', value: 'last_month' }, { label: 'This year', value: 'this_year' }, { label: 'Last year', value: 'last_year' }, { label: 'All time', value: 'all_time' },
];

function quickRange(type: QuickRangeType): { start: Date | null; end: Date | null } {
  const now = new Date();
  if (type === 'today') return { start: now, end: now };
  if (type === 'yesterday') { const date = new Date(now); date.setDate(date.getDate() - 1); return { start: date, end: new Date(date) }; }
  if (type === 'this_week') return { start: getStartOfWeek(now), end: getEndOfWeek(now) };
  if (type === 'last_week') { const date = new Date(now); date.setDate(date.getDate() - 7); return { start: getStartOfWeek(date), end: getEndOfWeek(date) }; }
  if (type === 'this_month') return { start: getStartOfMonth(now), end: getEndOfMonth(now) };
  if (type === 'last_month') { const date = new Date(now.getFullYear(), now.getMonth() - 1, 1); return { start: getStartOfMonth(date), end: getEndOfMonth(date) }; }
  if (type === 'this_year') return { start: getStartOfYear(now), end: getEndOfYear(now) };
  if (type === 'last_year') { const date = new Date(now.getFullYear() - 1, 0, 1); return { start: getStartOfYear(date), end: getEndOfYear(date) }; }
  return { start: null, end: null };
}
function getQuickActive(type: QuickRangeType, start?: Date | null, end?: Date | null) {
  if (type === 'all_time') return !start && !end;
  const target = quickRange(type);
  return isSameDate(start, target.start) && isSameDate(end, target.end);
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><path d={direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} /></svg>; }
function CalendarIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>; }
function ChevronDownIcon({ open }: { open: boolean }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn('size-3.5 transition-transform', open && 'rotate-180')}><path d="m6 9 6 6 6-6" /></svg>; }
function ClearIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5"><path d="m18 6-12 12M6 6l12 12" /></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5"><path d="m5 12 4 4L19 6" /></svg>; }

function RangeDropdownContent({ value, onChange }: { value?: DateRangeValue; onChange?: (value: DateRangeValue) => void }) {
  const close = useDropdownClose();
  const today = useMemo(() => new Date(), []);
  const selectedStart = useMemo(() => parseDate(value?.start), [value?.start]);
  const selectedEnd = useMemo(() => parseDate(value?.end), [value?.end]);
  const [tempStart, setTempStart] = useState<Date | null>(selectedStart);
  const [tempEnd, setTempEnd] = useState<Date | null>(selectedEnd);
  const [quickType, setQuickType] = useState<QuickRangeType | null>(null);
  const [leftMonth, setLeftMonth] = useState<Date>(() => startOfMonth(selectedStart || today));
  const rightMonth = useMemo(() => addMonth(leftMonth, 1), [leftMonth]);

  const syncTempFromValue = () => {
    const nextStart = parseDate(value?.start); const nextEnd = parseDate(value?.end);
    setTempStart(nextStart); setTempEnd(nextEnd); setQuickType(null); setLeftMonth(startOfMonth(nextStart || today));
  };
  useEffect(() => { syncTempFromValue(); }, [value?.start, value?.end]);

  const selectDate = (date: Date) => {
    setQuickType(null);
    if (!tempStart || tempEnd || date < tempStart) { setTempStart(date); setTempEnd(null); setLeftMonth(startOfMonth(date)); return; }
    setTempEnd(date);
  };
  const selectQuick = (type: QuickRangeType) => {
    const range = quickRange(type); setQuickType(type); setTempStart(range.start); setTempEnd(range.end); setLeftMonth(startOfMonth(range.start || today));
  };
  const apply = () => {
    if (quickType === 'all_time') { onChange?.({}); close?.(); return; }
    if (!tempStart || !tempEnd) return;
    onChange?.({ start: formatDate(tempStart), end: formatDate(tempEnd) }); close?.();
  };

  const renderCalendar = (monthDate: Date, side: 'left' | 'right') => {
    const year = monthDate.getFullYear(); const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate(); const firstDay = new Date(year, month, 1).getDay();
    return <div className="w-[240px] shrink-0">
      <div className="mb-3 flex items-center justify-between">
        {side === 'left' ? <button type="button" aria-label="Previous month" onClick={() => setLeftMonth((prev) => addMonth(prev, -1))} className="flex size-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"><ChevronIcon direction="left" /></button> : <div className="size-8" />}
        <span className="text-sm font-semibold text-[var(--color-text)]">{MONTHS[month]} {year}</span>
        {side === 'right' ? <button type="button" aria-label="Next month" onClick={() => setLeftMonth((prev) => addMonth(prev, 1))} className="flex size-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"><ChevronIcon direction="right" /></button> : <div className="size-8" />}
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-xs text-[var(--color-text-muted)]">{DAYS.map((day) => <div key={`${side}-${day}`} className="text-center font-medium">{day}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, index) => <div key={`${side}-empty-${index}`} />)}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const date = new Date(year, month, index + 1); const start = isSameDate(date, tempStart); const end = isSameDate(date, tempEnd); const selected = start || end; const inRange = Boolean(tempStart && tempEnd && date > tempStart && date < tempEnd); const isToday = isSameDate(date, today);
          return <button key={`${side}-${formatDate(date)}`} type="button" onClick={() => selectDate(date)} className={cn('h-9 rounded-lg text-sm transition-colors', selected && 'bg-[var(--color-brand)] font-semibold text-white', !selected && inRange && 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]', !selected && !inRange && 'hover:bg-[var(--color-surface-muted)]', !selected && isToday && 'ring-1 ring-[var(--color-brand)]/40')}>{index + 1}</button>;
        })}
      </div>
    </div>;
  };

  return <div className="max-w-[calc(100vw-16px)] overflow-x-auto p-4">
    <div className="flex min-w-[640px] gap-4">
      <div className="w-[104px] shrink-0 border-r border-[var(--color-border)] pr-3"><p className="mb-2 text-xs font-semibold text-[var(--color-text-muted)]">Cepat</p><div className="space-y-1">{QUICK_RANGE_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => selectQuick(option.value)} className={cn('w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors', getQuickActive(option.value, tempStart, tempEnd) ? 'bg-[var(--color-surface-muted)] text-[var(--color-text)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]')}>{option.label}</button>)}</div></div>
      <div className="flex gap-4">{renderCalendar(leftMonth, 'left')}{renderCalendar(rightMonth, 'right')}</div>
    </div>
    <div className="mt-4 flex min-w-[640px] items-center justify-between border-t border-[var(--color-border)] pt-3"><div className="text-xs text-[var(--color-text-muted)]">{tempStart && tempEnd ? `${formatDate(tempStart)} sampai ${formatDate(tempEnd)}` : quickType === 'all_time' ? 'Semua waktu' : 'Pilih tanggal awal dan akhir'}</div><div className="flex items-center gap-2"><button type="button" onClick={() => { syncTempFromValue(); close?.(); }} className="h-9 rounded-lg px-3 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]">Cancel</button><button type="button" disabled={quickType !== 'all_time' && (!tempStart || !tempEnd)} onClick={apply} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-4 text-sm font-semibold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"><CheckIcon />Apply</button></div></div>
  </div>;
}

export function RangeDatePicker({ label, placeholder = 'Pilih periode', value, size = 'md', onChange, error, hint, disabled = false, clearable = true, containerClassName }: RangeDatePickerProps) {
  const id = useId(); const s = INPUT_SIZE_STYLES[size];
  const displayValue = useMemo(() => value?.start && value?.end ? `${formatDisplayDate(value.start)} - ${formatDisplayDate(value.end)}` : '', [value?.start, value?.end]);
  return <div className={cn('flex min-w-0 flex-col gap-1.5', containerClassName)}>
    {label ? <label htmlFor={id} className={cn(s.label, 'inline-block w-fit font-medium text-[var(--color-text)]')}>{label}</label> : null}
    <Dropdown placement="bottom-end" contentRole="dialog" trigger={({ open }) => <div className="relative">
      <button id={id} type="button" disabled={disabled} className={cn('flex w-full items-center gap-2 rounded-lg border bg-[var(--color-surface)] pr-10 text-left focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)] disabled:opacity-50', s.input, error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]', displayValue ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]/60')}><span className="shrink-0 text-[var(--color-text-muted)]"><CalendarIcon /></span><span className="min-w-0 flex-1 truncate">{displayValue || placeholder}</span></button>
      <div className={cn('absolute top-1/2 flex -translate-y-1/2 items-center gap-1 text-[var(--color-text-muted)]', s.iconRight)}>{clearable && displayValue && !disabled ? <button type="button" aria-label="Clear date range" onMouseDown={(event) => event.preventDefault()} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onChange?.({}); }} className="rounded-md p-1 hover:bg-[var(--color-surface-muted)]"><ClearIcon /></button> : null}{!disabled ? <ChevronDownIcon open={open} /> : null}</div>
    </div>}><RangeDropdownContent {...(value === undefined ? {} : { value })} {...(onChange === undefined ? {} : { onChange })} /></Dropdown>
    {error ? <p className="text-xs text-[var(--color-danger)]">{error}</p> : null}{!error && hint ? <p className="text-xs text-[var(--color-text-muted)]">{hint}</p> : null}
  </div>;
}

