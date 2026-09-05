import type { ReactNode } from 'react';
import { Button } from '../button';
import { Dialog } from '../dialog';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: ReactNode;
  message?: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Konfirmasi', message = 'Apakah Anda yakin ingin melakukan aksi ini?', confirmLabel = 'Ya, Lanjutkan', cancelLabel = 'Batal', variant = 'danger', loading = false }: ConfirmDialogProps) {
  return <Dialog open={open} onClose={onClose} title={title} size="sm" footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose} disabled={loading}>{cancelLabel}</Button><Button variant={variant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button></div>}><p className="text-sm text-[var(--color-text-muted)]">{message}</p></Dialog>;
}
