import type { ReactNode } from 'react';
import { Button } from '../button';
export interface ConnectionErrorProps {
  onRetry: () => void;
  isRetrying?: boolean;
  title?: ReactNode;
  message?: ReactNode;
  detail?: ReactNode;
  diagnostics?: ReactNode;
}
function OfflineIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-9"><path d="M3 3l18 18M8.5 8.5A8 8 0 0 1 20 12M4 12a8 8 0 0 1 1.6-4.8M8.5 16.5A5 5 0 0 1 12 15c1.4 0 2.7.6 3.5 1.5M12 20h.01" /></svg>; }
export function ConnectionError({ onRetry, isRetrying = false, title = 'Koneksi Gagal', message = 'Tidak dapat terhubung ke server.', detail = 'Pastikan server backend sudah berjalan dan koneksi internet Anda stabil.', diagnostics }: ConnectionErrorProps) { return <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-[var(--color-background)] px-4"><div className="w-full max-w-sm text-center"><div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-[var(--color-danger)]/10 text-[var(--color-danger)]"><OfflineIcon /></div><h2 className="mb-2 text-xl font-bold text-[var(--color-text)]">{title}</h2><p className="mb-2 text-sm text-[var(--color-text-muted)]">{message}</p><p className="mb-8 text-xs text-[var(--color-text-muted)]/70">{detail}</p><Button onClick={onRetry} loading={isRetrying} fullWidth>{isRetrying ? 'Menghubungkan...' : 'Coba Lagi'}</Button>{diagnostics ? <div className="mt-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 p-3 text-left text-[11px] text-[var(--color-text-muted)]">{diagnostics}</div> : null}</div></div>; }
