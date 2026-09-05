import { cn } from '../cn';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}
export interface NotificationPanelProps {
  notifications: readonly NotificationItem[];
  open: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
  title?: string;
  emptyMessage?: string;
}
const dotClass: Record<NotificationItem['type'], string> = {
  info: 'bg-[var(--color-brand)]', success: 'bg-[var(--color-success)]', warning: 'bg-[var(--color-warning)]', error: 'bg-[var(--color-danger)]',
};
function CloseIcon({ small = false }: { small?: boolean }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={small ? 'size-3' : 'size-3.5'}><path d="m18 6-12 12M6 6l12 12" /></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5"><path d="m5 12 4 4L19 6" /></svg>; }
export function NotificationPanel({ notifications, open, onClose, onMarkRead, onMarkAllRead, onDismiss, title = 'Notifikasi', emptyMessage = 'Tidak ada notifikasi' }: NotificationPanelProps) {
  if (!open) return null;
  const unread = notifications.filter((item) => !item.read).length;
  return <><div className="fixed inset-0 z-40" onClick={onClose} /><div className="absolute right-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl sm:w-96"><div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3"><div className="flex items-center gap-2"><span className="text-sm font-semibold text-[var(--color-text)]">{title}</span>{unread > 0 ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand)] px-1.5 text-[10px] font-bold text-white">{unread}</span> : null}</div><div className="flex items-center gap-1">{unread > 0 ? <button type="button" aria-label="Mark all read" onClick={onMarkAllRead} className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"><CheckIcon /></button> : null}<button type="button" aria-label="Close notifications" onClick={onClose} className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"><CloseIcon /></button></div></div><div className="max-h-80 overflow-y-auto">{notifications.length === 0 ? <div className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">{emptyMessage}</div> : notifications.map((item) => <div key={item.id} onClick={() => onMarkRead(item.id)} className={cn('cursor-pointer border-b border-[var(--color-border)]/50 px-4 py-3 transition-colors hover:bg-[var(--color-surface-muted)]/30', !item.read && 'bg-[var(--color-brand)]/5')}><div className="flex items-start gap-3"><div className={cn('mt-1.5 size-2 shrink-0 rounded-full', !item.read ? dotClass[item.type] : 'bg-transparent')} /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-[var(--color-text)]">{item.title}</p><p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-text-muted)]">{item.message}</p><p className="mt-1 text-[10px] text-[var(--color-text-muted)]/60">{item.createdAt}</p></div><button type="button" aria-label="Dismiss notification" onClick={(event) => { event.stopPropagation(); onDismiss(item.id); }} className="rounded-md p-1 text-[var(--color-text-muted)]/40 hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-muted)]"><CloseIcon small /></button></div></div>)}</div></div></>;
}
