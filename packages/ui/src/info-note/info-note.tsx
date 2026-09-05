import type { ReactNode } from 'react';
import { cn } from '../cn';

export type InfoNoteVariant = 'info' | 'warning' | 'success' | 'tip';
export interface InfoNoteProps { variant?: InfoNoteVariant; title?: ReactNode; icon?: ReactNode; children: ReactNode; className?: string; }
function Icon({ type }: { type: InfoNoteVariant }) {
  if (type === 'warning') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v4M12 17h.01"/></svg>;
  if (type === 'success') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>;
  if (type === 'tip') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><path d="M9 18h6M10 22h4M8.5 14.5A7 7 0 1 1 15.5 14.5C14.5 15.5 14 16 14 18h-4c0-2-.5-2.5-1.5-3.5Z"/></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></svg>;
}
const variants: Record<InfoNoteVariant, { wrap: string; icon: string; title: string }> = {
  info: { wrap: 'border-[var(--color-brand)]/20 bg-[var(--color-brand)]/5', icon: 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]', title: 'text-[var(--color-brand)]' },
  warning: { wrap: 'border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5', icon: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]', title: 'text-[var(--color-warning)]' },
  success: { wrap: 'border-[var(--color-success)]/20 bg-[var(--color-success)]/5', icon: 'bg-[var(--color-success)]/10 text-[var(--color-success)]', title: 'text-[var(--color-success)]' },
  tip: { wrap: 'border-[var(--color-brand)]/15 bg-[var(--color-surface-muted)]', icon: 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]', title: 'text-[var(--color-text)]' },
};
export function InfoNote({ variant = 'info', title, icon, children, className }: InfoNoteProps) { const meta = variants[variant]; return <div role="note" className={cn('flex items-start gap-3 rounded-2xl border p-3.5', meta.wrap, className)}><div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', meta.icon)}>{icon ?? <Icon type={variant}/>}</div><div className="min-w-0 flex-1 space-y-0.5">{title ? <p className={cn('text-xs font-semibold', meta.title)}>{title}</p> : null}<div className="text-xs leading-relaxed text-[var(--color-text)]/80">{children}</div></div></div>; }
